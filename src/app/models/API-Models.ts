//  API - Jogo
export interface APIGame{
    id              : number;           //  Id do jogo na API
    name            : string;           //  Nome
    background_image: string;           //  Imagem
    metacritic      : number;           //  Nota
    platforms       : APIPlatform[];    //  Plataformas
    genres          : APIGenre[];       //  Gêneros
    developers      : APIDeveloper[];   //  Empresas
    esrb_rating     : APIESRBRating;    //  Faixa etária
    description_raw : string;           //  Descrição
    released        : string;           //  Data de lançamento
}

//  API - Plataforma
export interface APIPlatform{
    platform: APIPlatformData;
}

//  API - Dado da plataforma
export interface APIPlatformData{
    id  : number;
    name: string;
}

//  API - Gênero
export interface APIGenre{
    id  : number;
    name: string;
}

//  API - Empresa
export interface APIDeveloper{
    id  : number;
    name: string;
}

//  API - Nota
export interface APIESRBRating{
    id  : number;
    name: string;
}

//  Aplicação - Jogo
export interface Game{
    id         : number;
    name       : string;
    releaseDate: string;
    ageRating  : string;
    genres     : string[];
    platforms  : string[];
    companies  : string[];
    rating     : string;
    description: string;
    coverURL   : string;
}

//  Aplicação - Gênero
export interface Genre{
    id  : number;
    name: string;
}

//  Aplicação - Plataforma
export interface Platform{
    id  : number;
    name: string;
}

//  Aplicação - Empresa
export interface Company{
    id  : number;
    name: string;
}

//  Aplicação - Filtro
export interface FilterOption{
    preSelected: boolean;
    selected   : boolean;
    name       : string;
    value      : number;
}

//  Aplicação - Parâmetros dos filtros
export interface FilterOptionsParams {
    options    ?: FilterOption[];   //  Opções, caso seja aplicável
    query       : string;           //  Query a ser aplicada na busca pr esse filtro
    useFilter  ?: boolean;          //  Controle para usar ou não o filtro
    concatParam : string;           //  Texto do parâmetro de busca na query
    apiValues  ?: any[];            //  Valores das opções trazidos pela API
}

//  Aplicação - Gameplay
export interface Gameplay{
    gameId                : number;             //  ID do jogo na API
    gameName              : string;             //  Nome
    gameCoverURL          : string;             //  Imagem
    name                  : string;             //  Título da gameplay
    addingDate            : string;             //  Data de criação
    lastModifiedDate      : Date;               //  Valor com data da última modificação
    oldStatus             : string;             //  Status antigo (auxiliar para operação de alteração)
    status                : string;             //  Status atual
    stages                : GameplayStage[];    //  Fases
    stagesCreated         : number;             //  Quantidade de fases criadas
    notes                 : string;             //  Anotações
}

//  Aplicação - Fase da gameplay
export interface GameplayStage{
    gameplay              : Gameplay;                   //  Gameplay da fase
    id                    : number;                     //  ID da fase
    name                  : string;                     //  Nome
    description           : string;                     //  Descrição
    status                : GameplayStageStatusOptions; //  Status atual
    oldStatus             : GameplayStageStatusOptions; //  Status antigo (auxiliar para operação de alteração)
    createdDate           : string;                     //  Data de criação
    lastModifiedDateString: string;                     //  String com data da última modificação
    lastModifiedDate      : Date;                       //  Valor com data da última modificação
}


export enum GameplayStageStatusOptions {
    EmProgresso = 'Em progresso',
    Pausado     = 'Pausado',
    Concluido   = 'Concluído'
}

//  Aplicação - Enum de cada filtro
export enum Filters {
    Generos        = 'Gêneros',
    Plataformas    = 'Plataformas',
    Empresas       = 'Empresas',
    Nota           = 'Nota',
    DataLancamento = 'Data de lançamento'
}

//  Aplicação - Enum de cada possível status de gameplay
export enum GameplayStatusOptions {
    NaLista   = 'Na lista',
    Pausado   = 'Pausado',
    Jogando   = 'Jogando',
    Concluido = 'Concluído'
}

//  Aplicação - Enum com as seções navegáveis dentro de uma gameplay
export enum GameplayDetailsSections {
    Notas     = 'Notas',
    Fases     = 'Fases',
    Historico = 'Histórico'
}