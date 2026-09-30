#!/bin/bash
BASE="${BASE:-http://localhost:8000}"
RUN=$(date +%s)
EMAIL_A="ana_$RUN@correo.com"
EMAIL_B="beto_$RUN@correo.com"
PASS=0; FAIL=0

call() {  # call METODO RUTA [TOKEN] [JSON]
  local args=(-s -w "\n%{http_code}" -X "$1" "$BASE$2")
  [ -n "$3" ] && args+=(-H "Authorization: Bearer $3")
  [ -n "$4" ] && args+=(-H "Content-Type: application/json" -d "$4")
  local out; out=$(curl "${args[@]}")
  CODE=${out##*$'\n'}
  BODY=${out%$'\n'*}
}

jget() { python3 -c "import sys,json; print(json.load(sys.stdin)$1)"; }

check() {  # check "descripcion" esperado [obtenido]
  local got="${3:-$CODE}"
  if [ "$got" == "$2" ]; then echo "PASS  $1 ($got)"; PASS=$((PASS+1))
  else echo "FAIL  $1 (esperado $2, obtenido $got)"; FAIL=$((FAIL+1)); echo "      $BODY"; fi
}

echo "== Usuarios =="
call POST /users "" "{\"name\":\"Ana\",\"email\":\"$EMAIL_A\",\"password\":\"secreto123\"}"
check "Registro usuario A" 201
UID_A=$(echo "$BODY" | jget "['id']")

call POST /users "" "{\"name\":\"Ana\",\"email\":\"$EMAIL_A\",\"password\":\"secreto123\"}"
check "Registro con correo repetido" 409

call POST /users "" "{\"name\":\"Beto\",\"email\":\"$EMAIL_B\",\"password\":\"secreto123\"}"
check "Registro usuario B" 201

call POST /login "" "{\"email\":\"$EMAIL_A\",\"password\":\"secreto123\"}"
check "Login A correcto" 200
TOKEN_A=$(echo "$BODY" | jget "['access_token']")

call POST /login "" "{\"email\":\"$EMAIL_A\",\"password\":\"incorrecta\"}"
check "Login A con clave mala" 401

call POST /login "" "{\"email\":\"$EMAIL_B\",\"password\":\"secreto123\"}"
TOKEN_B=$(echo "$BODY" | jget "['access_token']")

call GET "/users/$UID_A"
check "Perfil de A" 200
call GET /users/999999
check "Perfil inexistente" 404

echo; echo "== Videos =="
VIDEO='{"title":"Mi primer video","description":"Prueba","video_url":"https://example.com/v.mp4","thumbnail_url":"https://example.com/t.jpg"}'

call POST /videos "" "$VIDEO"
check "Crear video sin token" 401

call POST /videos "$TOKEN_A" "$VIDEO"
check "Crear video (A)" 201
VID=$(echo "$BODY" | jget "['id']")

call GET /videos
check "Listar videos" 200

call GET "/videos?user_id=$UID_A"
check "Listar videos de A (perfil)" 200

call GET "/videos?exclude_id=$VID"
check "Recomendados (excluye el actual)" 200

call GET "/videos/$VID"
check "Ver video (1ª vez)" 200
call GET "/videos/$VID"
check "Las vistas suben a 2" 2 "$(echo "$BODY" | jget "['views']")"

call GET /videos/999999
check "Video inexistente" 404

call GET "/users/$UID_A"
check "video_count de A es 1" 1 "$(echo "$BODY" | jget "['video_count']")"

call PUT "/videos/$VID" "$TOKEN_A" '{"title":"Título nuevo"}'
check "Editar video (dueño)" 200
check "El título cambió" "Título nuevo" "$(echo "$BODY" | jget "['title']")"

call PUT "/videos/$VID" "$TOKEN_B" '{"title":"Hackeado"}'
check "Editar video ajeno" 403

call PUT "/videos/$VID" "" '{"title":"Sin token"}'
check "Editar sin token" 401

echo; echo "== Comentarios =="
call POST "/videos/$VID/comments" "" '{"content":"Sin token"}'
check "Comentar sin token" 401

call POST "/videos/$VID/comments" "$TOKEN_B" '{"content":"Buen video"}'
check "Comentar (B)" 201

call GET "/videos/$VID/comments"
check "Listar comentarios" 200
check "Hay 1 comentario" 1 "$(echo "$BODY" | jget ".__len__()")"

call POST /videos/999999/comments "$TOKEN_B" '{"content":"x"}'
check "Comentar video inexistente" 404

echo; echo "== Eliminar =="
call DELETE "/videos/$VID" "$TOKEN_B"
check "Eliminar video ajeno" 403

call DELETE "/videos/$VID" "$TOKEN_A"
check "Eliminar video (dueño)" 204

call GET "/videos/$VID"
check "Video ya no existe" 404

echo; echo "Resultado: $PASS pasaron, $FAIL fallaron"
[ "$FAIL" -eq 0 ]
