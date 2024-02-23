# oPwngrid-server

This is a version of api.pwnagotchi.ai created using expressjs, it is a backup in case api.pwnagotchi.ai goes down indefinitely.

# Setting up
## Prerequisites
- `node > 16.10`
- `npm`
- Running MySQL server 

## For development
1. Clone this repo `git clone https://github.com/Pwnagotchi-Unofficial/oPwngrid-server`
2. Enter the folder `cd oPwngrid-server`
3. Install required packages `npm i`
4. Create a copy of `.env.sample` with name `.env`, and set the environment variables
5. Run `npm start` to start the server

## Docker

To run the server in Docker, the easiest way it's by creating a `docker-compose.yml` file inside the root of the project with the following content:

```yaml
version: "3"
services:
  opwngrid:
    build: .
    container_name: opwngrid
    ports:
        - 8000:8000
    environment:
      - PORT=8000
      - DB_HOST=172.17.0.1
      - DB_PORT=3306
      - DB_USER=opwngridUser
      - DB=opwngrid
      - DB_PASS=your_hopefully_secure_password
      - SECRET=JWT_token_secret
      - ENVIROMENT=development # can also be production
```

Then to start the container run:
```shell
docker compose up
```

You can also build the image manually and then create the container passing all environment variables in the `docker run` command.

## Todo:

Add more JWT checks.