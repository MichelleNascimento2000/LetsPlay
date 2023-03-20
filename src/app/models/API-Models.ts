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
    gameId                : number; //  ID do jogo na API
    gameName              : string; //  Nome
    gameCoverURL          : string; //  Imagem
    name                  : string; //  Título da gameplay
    addingDate            : string; //  Data de criação
    lastModifiedDate      : Date;   //  Valor com data da última modificação
    oldStatus             : string; //  Status antigo (auxiliar para operação de alteração)
    status                : string; //  Status atual
    stagesCreated         : number; //  Quantidade de fases criadas
    notes                 : string; //  Anotações
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