# TODO


- [ ] Actually implement all tests
- [ ] Switch to MongoDB
  - Write a migration script
  - [ ] Look at Digital Ocean for hosting
- [ ] Better security, don't use preshared bearer token
  - [ ] Use JWT
  - [ ] Use a better way to store the token
  - [ ] Use a better way to generate the token
  - [ ] Use a better way to validate the token
- [ ] Implement communication to the bot
  - [ ] Implement a way to send messages to the bot
    - Local REST API
    - Websocket
  - [ ] Implement a way to receive messages from the bot
    - Some kind of ID system that registers with the bot