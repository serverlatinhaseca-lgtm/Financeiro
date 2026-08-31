# Configuração de APIs e mapa

Esta versão funciona imediatamente, sem cadastrar cartão, projeto externo ou chave de API.

## Serviços utilizados

| Função | Serviço padrão | Chave necessária |
| --- | --- | --- |
| Consulta de CNPJ | BrasilAPI | Não |
| Consulta de CEP | ViaCEP | Não |
| Mapa cartográfico | OpenStreetMap | Não |
| Interação, marcadores e rotas | Leaflet | Não |

O servidor precisa apenas de acesso HTTPS de saída e DNS funcionando. O navegador dos usuários também precisa conseguir carregar os blocos cartográficos do OpenStreetMap.

## Testes rápidos no servidor

```bash
curl -I https://brasilapi.com.br/api/cnpj/v1/19131243000197
curl -I https://viacep.com.br/ws/12243000/json/
curl -I https://tile.openstreetmap.org/10/307/548.png
```

Respostas HTTP `200` confirmam o acesso. Se houver bloqueio, libere HTTPS de saída na porta 443 para os domínios usados.

## Funcionamento do mapa

- O administrador define a cor de cada rota em **Base de Rotas → Rotas → Editar → Cor da rota**.
- O usuário escolhe entre mapa claro, ruas detalhadas e modo noturno roxo.
- Marcadores numerados mostram a sequência das paradas.
- O painel informa distância estimada, tempo de percurso, quantidade de paradas, saída e chegada.
- Ao clicar em uma parada, são exibidos cliente, endereço, motorista, viagem, ordem e horário previsto.
- Registros com latitude e longitude usam as coordenadas cadastradas. Enquanto esses dados não existirem, o sistema sinaliza que a posição é estimada.

## Integração opcional futura com Google Maps

A instalação entregue não depende do Google Maps. Se a empresa decidir contratá-lo futuramente:

1. Crie um projeto no Google Cloud Console.
2. Ative faturamento no projeto.
3. Ative Maps JavaScript API, Geocoding API e Routes API.
4. Crie uma chave para o navegador e restrinja-a aos domínios do sistema.
5. Crie outra chave para o servidor e restrinja-a ao IP público do servidor.
6. Guarde as chaves somente no `.env`; nunca envie o arquivo ao GitHub.
7. Solicite a troca do provedor no código antes de desativar os serviços gratuitos atuais.

## Privacidade e limites

As consultas de CEP e CNPJ enviam apenas os números pesquisados aos serviços públicos correspondentes. Não envie senhas, dados bancários ou observações internas para esses serviços. Para grande volume ou garantia formal de disponibilidade, contrate um provedor com SLA e mantenha cache local.
