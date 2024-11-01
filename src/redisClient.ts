import { createClient } from 'redis';
import { ProductsRepository } from './ProductsRepository';
import { Product } from './product';

const productsRepo = new ProductsRepository();

async function conectarAoRedis() {
    const client = createClient({ url: 'redis://localhost:7070' });

    client.on('error', (err) => console.error('Erro no Cliente Redis', err));

    await client.connect();
    return client;
}

async function sincronizarProdutosNoRedis(client) {
    try {
        const produtos = await productsRepo.getAll();

        await Promise.all(produtos.map(async (produto) => {
            await client.set(`product:${produto.ID}`, JSON.stringify(produto));
        }));

        console.log('Dados do MySQL carregados no Redis');
    } catch (err) {
        console.error('Erro ao carregar produtos:', err);
    }
}

async function limparRedis(client) {
    try {
        const chaves = await client.keys('product:*');

        if (chaves.length === 0) {
            console.log('Nenhum produto para excluir no Redis');
            return; // Adicionando retorno para evitar continuar se não houver chaves
        }

        await Promise.all(chaves.map(async (chave) => {
            await client.del(chave);
        }));

        console.log('Redis purgado');
    } catch (err) {
        console.error('Erro ao purgar o Redis:', err);
    }
}

async function verificarSincroniaRedis(client) {
    const produtosDB = await productsRepo.getAll();
    const chaves = await client.keys('product:*');

    const produtosRedis = await Promise.all(chaves.map(async (chave) => {
        const produto = await client.get(chave);
        return JSON.parse(produto!);
    }));

    // Comparar os produtos do banco de dados e os produtos do Redis
    // Implementar a lógica para lidar com inconsistências se necessário

    return produtosDB.length === produtosRedis.length; // Exemplo básico de verificação
}

// Uso
(async () => {
    const client = await conectarAoRedis();
    await limparRedis(client); // Limpa o Redis antes de sincronizar
    await sincronizarProdutosNoRedis(client);
    const isSynchronized = await verificarSincroniaRedis(client);
    console.log('Sincronização completa:', isSynchronized);
    await client.quit(); // Fecha a conexão do cliente Redis
})();

export { client, sincronizarProdutosNoRedis, limparRedis, verificarSincroniaRedis };
