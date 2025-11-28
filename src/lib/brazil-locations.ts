export const BRAZIL_STATE_CODES = [
  "AC",
  "AL",
  "AM",
  "AP",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
] as const;

export type BrazilUF = (typeof BRAZIL_STATE_CODES)[number];

export type BrazilState = {
  uf: BrazilUF;
  nome: string;
  cidades: string[];
};

export const brazilStates: BrazilState[] = [
  {
    uf: "AC",
    nome: "Acre",
    cidades: ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira", "Tarauacá"],
  },
  {
    uf: "AL",
    nome: "Alagoas",
    cidades: ["Maceió", "Arapiraca", "Palmeira dos Índios", "Rio Largo"],
  },
  {
    uf: "AM",
    nome: "Amazonas",
    cidades: ["Manaus", "Parintins", "Itacoatiara", "Manacapuru"],
  },
  {
    uf: "AP",
    nome: "Amapá",
    cidades: ["Macapá", "Santana", "Laranjal do Jari", "Oiapoque"],
  },
  {
    uf: "BA",
    nome: "Bahia",
    cidades: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Ilhéus"],
  },
  {
    uf: "CE",
    nome: "Ceará",
    cidades: ["Fortaleza", "Juazeiro do Norte", "Sobral", "Maracanaú"],
  },
  {
    uf: "DF",
    nome: "Distrito Federal",
    cidades: ["Brasília", "Taguatinga", "Ceilândia", "Gama"],
  },
  {
    uf: "ES",
    nome: "Espírito Santo",
    cidades: ["Vitória", "Vila Velha", "Serra", "Cariacica"],
  },
  {
    uf: "GO",
    nome: "Goiás",
    cidades: ["Goiânia", "Anápolis", "Aparecida de Goiânia", "Rio Verde"],
  },
  {
    uf: "MA",
    nome: "Maranhão",
    cidades: ["São Luís", "Imperatriz", "Caxias", "Timon"],
  },
  {
    uf: "MG",
    nome: "Minas Gerais",
    cidades: ["Belo Horizonte", "Uberlândia", "Juiz de Fora", "Contagem"],
  },
  {
    uf: "MS",
    nome: "Mato Grosso do Sul",
    cidades: ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá"],
  },
  {
    uf: "MT",
    nome: "Mato Grosso",
    cidades: ["Cuiabá", "Várzea Grande", "Rondonópolis", "Sinop"],
  },
  {
    uf: "PA",
    nome: "Pará",
    cidades: ["Belém", "Ananindeua", "Santarém", "Marabá"],
  },
  {
    uf: "PB",
    nome: "Paraíba",
    cidades: ["João Pessoa", "Campina Grande", "Patos", "Sousa"],
  },
  {
    uf: "PE",
    nome: "Pernambuco",
    cidades: ["Recife", "Olinda", "Jaboatão dos Guararapes", "Petrolina"],
  },
  {
    uf: "PI",
    nome: "Piauí",
    cidades: ["Teresina", "Parnaíba", "Picos", "Floriano"],
  },
  {
    uf: "PR",
    nome: "Paraná",
    cidades: ["Curitiba", "Londrina", "Maringá", "Foz do Iguaçu"],
  },
  {
    uf: "RJ",
    nome: "Rio de Janeiro",
    cidades: ["Rio de Janeiro", "Niterói", "Campos dos Goytacazes", "Volta Redonda"],
  },
  {
    uf: "RN",
    nome: "Rio Grande do Norte",
    cidades: ["Natal", "Mossoró", "Parnamirim", "Caicó"],
  },
  {
    uf: "RO",
    nome: "Rondônia",
    cidades: ["Porto Velho", "Ji-Paraná", "Ariquemes", "Cacoal"],
  },
  {
    uf: "RR",
    nome: "Roraima",
    cidades: ["Boa Vista", "Rorainópolis", "Caracaraí", "Alto Alegre"],
  },
  {
    uf: "RS",
    nome: "Rio Grande do Sul",
    cidades: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Santa Maria"],
  },
  {
    uf: "SC",
    nome: "Santa Catarina",
    cidades: ["Florianópolis", "Joinville", "Blumenau", "Chapecó"],
  },
  {
    uf: "SE",
    nome: "Sergipe",
    cidades: ["Aracaju", "Nossa Senhora do Socorro", "Lagarto", "Itabaiana"],
  },
  {
    uf: "SP",
    nome: "São Paulo",
    cidades: ["São Paulo", "Campinas", "Santos", "Ribeirão Preto"],
  },
  {
    uf: "TO",
    nome: "Tocantins",
    cidades: ["Palmas", "Araguaína", "Gurupi", "Porto Nacional"],
  },
];

