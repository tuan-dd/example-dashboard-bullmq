This example shows how to use Express.js as a server for bull-board.

## Installation

```yarn```

## ENV Variables

- NODE_ENV
- PORT
- REDIS_HOST
- REDIS_PORT
- REDIS_USERNAME (optional)
- REDIS_PASSWORD (optional)
- NAME_JOBS example ["job1", "job2"]
- READ_ONLY

```cp .env.example .env```

## Run

```yarn start```



## docker
```docker build --build-arg PORT=${PORT} -t test .```

## Notes
- The port is set to 4000 by default
- if you image can connection redis you add network
  
```docker run -p ${PORT}:${PORT} --name test -d -p ${PORT}:PORT --network ${NETWORK} test```
