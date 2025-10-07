curl --request POST \
  --url http://localhost:3001/b2b/v1/front/grids/get \
  --header 'Authorization: OAuth 1234567890' \
  --header 'Content-Type: application/json' \
  --data '{"locale": "en"}' -vvs
