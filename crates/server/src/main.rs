#29 [backend-builder 1/4] COPY crates/server/src ./crates/server/src
#29 DONE 0.1s
#30 [backend-builder 2/4] COPY crates/server/migrations ./crates/server/migrations
#30 DONE 0.1s
#31 [backend-builder 3/4] COPY --from=frontend-builder /app/frontend/dist ./crates/frontend/dist
#31 DONE 0.1s
#32 [backend-builder 4/4] RUN cargo build --release -p latents-server
#32 0.659    Compiling latents-server v0.1.0 (/app/crates/server)
#32 83.38     Finished `release` profile [optimized] target(s) in 1m 23s
#32 DONE 91.1s
#33 [stage-3 2/4] RUN apk add --no-cache ca-certificates
#33 CACHED
#34 [stage-3 3/4] WORKDIR /app
#34 sha256:4cadf9049b725ec1299dbc5f242d8ca567dd69d8b8370dcfec7f02aa969fea61 296.09kB / 296.09kB 0.0s done
#34 extracting sha256:4cadf9049b725ec1299dbc5f242d8ca567dd69d8b8370dcfec7f02aa969fea61
#34 extracting sha256:4cadf9049b725ec1299dbc5f242d8ca567dd69d8b8370dcfec7f02aa969fea61 0.8s done
#34 sha256:15cf75694a73d47e9eb2bab8fedc9639e44dfdff11c233ec6119bd382bc249f8 92B / 92B done
#34 extracting sha256:15cf75694a73d47e9eb2bab8fedc9639e44dfdff11c233ec6119bd382bc249f8 0.1s done
#34 CACHED
#35 [stage-3 4/4] COPY --from=backend-builder /app/target/release/latents-server /usr/local/bin/
#35 DONE 0.2s
#36 exporting to docker image format
#36 exporting layers
#36 exporting layers 0.5s done
#36 exporting manifest sha256:70005f55decdcd9cba09c08d5d8cd6583e4f792856c502cdbadbb17f72e97f35 0.0s done
#36 exporting config sha256:3bb7106964a612914d13be89866705260a4309d436b3885b32f20c30cbebf9b5 0.0s done
#36 DONE 0.5s
#37 exporting cache to client directory
#37 preparing build cache for export
#37 writing cache image manifest sha256:dec846320f0a58a6fcea61270ccc95f46fa4cd1795923cee65a907ba1e426668 0.0s done
#37 DONE 43.7s
Pushing image to registry...
Upload succeeded
==> Deploying...
==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-03-16T10:19:01.208486Z  INFO latents_server: Starting server in Development mode
2026-03-16T10:19:01.208544Z  INFO latents_server: Connecting to database...
==> No open ports detected, continuing to scan...
Menu
==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
Error: pool timed out while waiting for an open connection
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
