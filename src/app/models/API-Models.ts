//  API - Jogo
export interface APIGame{
    id              : number;
    name            : string;
    background_image: string;
    metacritic      : number;
    platforms       : APIPlatform[];
    genres          : APIGenre[];
    developers      : APIDeveloper[];
    esrb_rating     : APIESRBRating;
    description_raw : string;
    released        : string;
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
    options    ?: FilterOption[];
    query       : string;
    useFilter  ?: boolean;
    concatParam : string;
    apiValues  ?: any[];
}

//  Aplicação - Enum de cada filtro
export enum Filters {
    Generos        = 'Gêneros',
    Plataformas    = 'Plataformas',
    Empresas       = 'Empresas',
    Nota           = 'Nota',
    DataLancamento = 'Data de lançamento'
}