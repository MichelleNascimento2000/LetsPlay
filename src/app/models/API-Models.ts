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

export interface APIPlatform{
    platform: APIPlatformData;
}

export interface APIPlatformData{
    id  : number;
    name: string;
}

export interface APIGenre{
    id  : number;
    name: string;
}

export interface APIDeveloper{
    id  : number;
    name: string;
}

export interface APIESRBRating{
    id  : number;
    name: string;
}

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


export interface Genre{
    id  : number;
    name: string;
}

export interface Platform{
    id  : number;
    name: string;
}

export interface Company{
    id  : number;
    name: string;
}