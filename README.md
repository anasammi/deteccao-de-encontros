# Detecção de Encontros entre Monitorados

## 1. Visão geral

Este projeto foi desenvolvido em Node.js para identificar encontros entre pessoas monitoradas a partir de registros de geolocalização.

O objetivo é identificar pares de pessoas que estejam a menos de 20 metros de distância no mesmo momento e classificar os encontros de acordo com as regras estabelecidas.

## 2. Lógica utilizada

O processamento foi dividido em três etapas principais:

### 2.1. Leitura e interpretação dos dados

Os arquivos de entrada são separados por ponto e vírgula (`;`).

A leitura é realizada utilizando `fs.createReadStream` e `readline`, permitindo processar o arquivo linha por linha, sem carregar todo o conteúdo na memória.

Cada linha é convertida em um objeto contendo o ID do monitorado, facção, timestamp, coordenadas geográficas, informação de medida protetiva e lista de restrições.

Como os registros estão ordenados por timestamp, o sistema agrupa e processa os registros de cada horário separadamente.

### 2.2. Identificação dos encontros

Para evitar comparar todas as pessoas entre si, foi implementada uma grade espacial 3D.

Primeiro, as coordenadas de latitude e longitude são convertidas para coordenadas cartesianas tridimensionais (ECEF). Em seguida, cada pessoa é associada a uma célula espacial de 20 metros.

Para cada registro, o algoritmo verifica apenas a célula correspondente e suas 26 células vizinhas. Dessa forma, são considerados apenas os candidatos que podem estar próximos o suficiente para formar um encontro.

Essa estratégia reduz a quantidade de comparações necessárias, principalmente em datasets com muitos registros e pessoas geograficamente distantes.

Os candidatos encontrados são validados utilizando a fórmula de Haversine, com raio terrestre de 6.371.000 metros. Somente pares com distância inferior a 20 metros são considerados encontros.

### 2.3. Classificação e geração dos resultados

Após identificar um encontro, o sistema verifica sua classificação:

- **protetiva:** quando uma das pessoas possui medida protetiva e o ID da outra está em sua lista de restrições;
- **faccao:** quando ambas possuem a mesma facção cadastrada;
- **generico:** quando nenhuma das condições anteriores é atendida.

Os pares são organizados com os IDs em ordem crescente para evitar duplicidades relacionadas à ordem dos registros.

Por fim, os resultados são ordenados por timestamp e pelos IDs dos monitorados e exportados em formato JSON.

## 3. Como executar o projeto

### Pré-requisitos

- Node.js 18 ou superior.

Não é necessário instalar dependências externas.

### Executar os testes

Na raiz do projeto, execute:

```bash
npm test
```

### Processar um dataset

Execute o comando informando o arquivo de entrada e o caminho do arquivo de saída:

```bash
node src/index.js datasets/dataset1.txt outputs/resultado1.json
```

Para processar outro dataset, basta alterar os nomes dos arquivos. Por exemplo:

```bash
node src/index.js datasets/dataset7.txt outputs/resultado7.json
```

O resultado será gerado no diretório `outputs/`.

## 4. Por que esta abordagem?

Acredito que essa seja uma boa abordagem para o problema porque busca equilibrar precisão, desempenho e consumo de memória.

Uma comparação tradicional entre todos os pares de pessoas de cada timestamp teria complexidade quadrática em relação à quantidade de registros daquele horário. Com a grade espacial 3D, o algoritmo reduz as comparações para registros localizados em células próximas, evitando cálculos de distância desnecessários.

A utilização da fórmula de Haversine na validação final mantém a precisão do cálculo geográfico, enquanto a conversão para coordenadas cartesianas permite realizar uma busca espacial eficiente.

Além disso, a leitura em fluxo aproveita a ordenação dos timestamps para processar um grupo por vez, evitando carregar o dataset inteiro na memória.

Essa combinação torna a solução mais adequada para datasets grandes do que uma abordagem baseada em comparação de todos os pares e leitura integral do arquivo.

## 5. Estrutura do projeto

```text
deteccao-de-encontros/
├── src/
│   ├── index.js
│   ├── parser.js
│   ├── haversine.js
│   └── detector.js
├── test/
│   └── detector.test.js
├── datasets/
├── outputs/
├── package.json
└── README.md
```