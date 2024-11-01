DROP DATABASE IF EXISTS proj_redis_sql;
CREATE DATABASE proj_redis_sql;

DROP TABLE IF EXISTS proj_redis_sql.products;
CREATE TABLE proj_redis_sql.products(
	ID INT not null primary key auto_increment,
    NAME varchar(50) not null,
    PRICE decimal(10,2) not null default 0,
    DESCRIPTION varchar(500) not null
);

INSERT INTO proj_redis_sql.products (
	NAME,
    PRICE,
    DESCRIPTION
) VALUES (
	'Merceds gls 600',
    338000000,
    'Incrivelmente luxuoso e extremamente potente: o Mercedes-Maybach GLS impressiona com equipamento de primeira classe e tecnologia de alto nível.'
);

INSERT INTO proj_redis_sql.products (
	NAME,
    PRICE,
    DESCRIPTION
) VALUES (
	'Iphone 16 PRO MAX',
    230000,
    'A estrutura do iPhone 16 Pro é em titânio Grau 5 com um novo acabamento por microjateamento. Como o titânio tem uma das melhores relações resistência-peso entre os metais, os modelos são superleves e incrivelmente resistentes.'
);
