const express = require('express');
const cors = require('cors');
const https = require('https');
const axios = require('axios');
const fs = require('fs');
const parser = require('xml2js').parseString;
const app = express();
const path = require('path');
const cron = require('cron').CronJob;
const json = require('./temp/arquivo.json') || "";
const port = process.env.PORT || 8080;

app.use(cors());

const agent = new https.Agent({ rejectUnauthorized: false });

async function saveXML() {
  try {
    const response = await axios.get('https://webservice.aldo.com.br/asp.net/ferramentas/integracao.ashx?u=79443&p=xt3cc0', { httpsAgent: agent });
    
    fs.writeFile('./temp/arquivo.xml', response.data, (error) => {
      console.error(error);
    });
    
    console.log('XML carregado!');
    convertToJSON();
  } catch (error) {
    console.error(error);
  }
}

function convertToJSON() {
  fs.readFile('./temp/arquivo.xml', 'utf-8', (error, data) => {
    if (error ) return console.error(error);

    parser(data, (err, result) => {
      if (err) return console.error(err);

      fs.writeFile('./temp/arquivo.json', JSON.stringify(result), (errorFS) => {
        if (errorFS) return console.error(errorFS);

        console.info('Transformação em JSON finalizada!');
      });
    });
  });
}

//0 5 * * * inicia a busca as 5horas da manhã

new cron('00 14 * * *', () => {
  console.log('Fetch da API iniciado.');
  saveXML();
}).start();

app.use(express.json());
app.use(express.static(__dirname + '/dist/CalculadoraSolar'));

app.get('/dados', (request, response) => {
  response.status(200).json(json);
});

app.get('/*', (request, response) => response.sendFile(path.join(__dirname+'/dist/CalculadoraSolar/index.html')));

app.listen(process.env.PORT || 8080, () => console.info(`Servidor rodando na porta: ${port}`));