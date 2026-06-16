import express from "express"
import { createProxyMiddleware } from "http-proxy-middleware"
import morgan from "morgan"


const app = express();

app.use(morgan("dev"));


app.get('/api/status/healthz',(req,res)=>{

    res.status(200).json({
        message:"Router is healthy",
        status:'ok'
    })
})


app.get('/api/status/readyz',(req,res)=>{
    
    res.status(200).json({
        message:"Router is ready",
        status:'ok'
    })
})

const proxyCache = new Map();

app.use((req, res, next) => {

    const host = req.headers.host
    const sandboxId = host.split('.')[0]; // extract only sandboxId

    const target = `http://sandbox-service-${sandboxId}` // target api constructed here

    // Cache proxy instances per sandboxId to avoid recreating on every request
    if (!proxyCache.has(sandboxId)) {
        proxyCache.set(sandboxId, createProxyMiddleware({
            target,
            changeOrigin: true,
            ws: true, // ws stands for websocket
            on: {
                error: (err, req, res) => {
                    console.error('[Proxy Error]', err.message);
                    res.status(502).send(`Error occurred while trying to proxy: ${host}${req.url}`);
                }
            }
        }));
    }

    return proxyCache.get(sandboxId)(req, res, next);

})


export default app;
