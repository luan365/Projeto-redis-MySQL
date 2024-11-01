import express, { Request, Response, Router } from "express";
import { ProductsRepository } from "./ProductsRepository";
import { Product } from "./product";
import { client, purgeRedis, syncRedis, checkRedisSync } from "./redisClient";

const app = express();
const port = 3000;
const routes = Router();

app.use(express.json());

const productsRepo = new ProductsRepository();

routes.get('/', (req: Request, res: Response) => {
    res.status(200).send("Funcionando...");
});

routes.get('/checkRedisSync', async (req: Request, res: Response) => {
    const isSynchronized = await checkRedisSync();
    res.status(200).json({ synchronized: isSynchronized });
});

routes.get('/syncRedis', async (req: Request, res: Response) => {
    try {
        await syncRedis();
        res.status(200).send("Redis sincronizado!");
    } catch (error) {
        res.status(500).send({ error: "Erro ao sincronizar o Redis" });
    }
});

routes.delete('/purgeRedis', async (req: Request, res: Response) => {
    try {
        await purgeRedis();
        res.status(200).send("Redis purgado");
    } catch (err) {
        console.error("Falha ao apagar redis", err);
        res.status(500).send({ error: "Erro ao purgar o Redis" });
    }
});

routes.delete('/deleteProduct', async (req: Request, res: Response) => {
    if (!(await checkRedisSync())) await syncRedis();

    const { id } = req.body;

    if (id === undefined) {
        return res.status(400).send({ error: "ID não está presente" });
    }

    try {
        await productsRepo.delete(id);
        await syncRedis();
        res.status(204).send(); // No Content
    } catch (error) {
        res.status(500).send({ error: "Erro ao deletar o produto" });
    }
});


routes.get('/getAllProducts', async (req: Request, res: Response) => {
    try {
        if (!(await checkRedisSync())) await syncRedis();

        const keys = await client.keys('product:*');
        console.log("Chaves encontradas no Redis:", keys);

        const products = await Promise.all(keys.map(async (key) => {
            const product = await client.get(key);
            return JSON.parse(product!);
        }));

        console.log("Produtos encontrados:", products);
        res.status(200).json(products);
    } catch (err) {
        console.error("Erro ao buscar produtos no Redis", err);
        res.status(500).json({ message: "Erro interno ao buscar produtos." });
    }
});

routes.get('/getById', async (req: Request, res: Response) => {
    if (!(await checkRedisSync())) await syncRedis();

    const { ID } = req.body;

    if (!ID) {
        console.error("ID obrigatório");
        return res.status(400).send({ error: "ID é obrigatório" });
    }

    const product = await client.get(`product:${ID}`);

    if (product) {
        res.status(200).json(JSON.parse(product));
    } else {
        res.status(404).json({ message: "Nenhum produto com tal ID" });
    }
});

routes.get('/getByName', async (req: Request, res: Response) => {
    if (!(await checkRedisSync())) await syncRedis();

    const { NAME } = req.body;

    if (!NAME) {
        console.error("Nome obrigatório");
        return res.status(400).send({ error: "Nome é obrigatório" });
    }

    const keys = await client.keys('product:*');
    const products = await Promise.all(keys.map(async (key) => {
        const product = await client.get(key);
        return JSON.parse(product!);
    }));

    const foundProduct = products.find(produto => 
        produto.NAME.toLowerCase().includes(NAME.toLowerCase())
    );

    if (foundProduct) {
        res.status(200).json(foundProduct);
    } else {
        res.status(404).json({ message: "Produto não encontrado" });
    }
});

routes.put('/updateProduct', async (req: Request, res: Response) => {
    if (!(await checkRedisSync())) await syncRedis();

    const { id, name, price, description } = req.body;

    if (id === undefined) {
        return res.status(400).send({ error: "ID não está presente" });
    }

    const newProd = new Product(name, price, description, id);

    try {
        await productsRepo.update(newProd);
        await syncRedis();
        res.status(200).json(newProd);
    } catch (error) {
        res.status(500).send({ error: "Erro ao alterar o produto" });
    }
});

routes.put('/insertProduct', async (req: Request, res: Response) => {
    if (!(await checkRedisSync())) await syncRedis();

    const { name, price, description } = req.body;

    try {
        const product = await productsRepo.create(name, price, description);
        await syncRedis();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).send({ error: "Erro ao inserir o produto" });
    }
});

// Aplicar as rotas na aplicação web backend
app.use(routes);

app.listen(port, async () => {
    console.log(`Sercidor rodando na porta: ${port}`);

    await client.ping();
    console.log("Redis conectado");
    await syncRedis();

    if (!(await checkRedisSync())) {
        await syncRedis();
    }
});
