import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Storage } from '@ionic/storage';
import axios from "axios";
import { APIGame, Game, Genre, Platform } from '../models/API-Models';
import { AlertController, LoadingController } from '@ionic/angular';

@Injectable({
    providedIn: 'root'
})
export class DatabaseService {

    constructor(
		public storage          : Storage,
		public loadingController: LoadingController,
		public alertController  : AlertController
    ){}


    //  Evitar recursão do OnInit da home.page
	public haveAppOpened: boolean = false;

    //  Controle para exibir mensagem de "Nenhum resultado encontrado" caso não ache jogos
    public hasLoadedGamesOnPage = true;

    //  Controle para saber se todos os jogos da pesquisa na API foram exibidos no passar de páginas
    public hasReachedMaxPages: Boolean = false;

    

    //  Variáveis para formar as chamadas da API
    public apiURL             = environment.url;
    public dataTypeParam      = 'games';
    public dataIDParam        = '';
    public keyParam           = '?key=' + this.getStageFromName();
    public pageSizeParam      = '&page_size=';
    public pageSizeCountParam = 40;
    public pageParam          = '&page=';
    public pageIndexParam     = 1;
    public searchParam        = '&search=';
	public currentWhere       = '';
    public formattedInputName = '';
    public inputName;
    
    //  Variáveis para controle de paginação
    public currentPage: number = 1;

    //  Variável com os parâmetros para formatação de data
    public dateFormat: Intl.DateTimeFormatOptions = {
		day  : '2-digit',
		month: '2-digit',
		year : 'numeric'
	}

    //  Variáveis para armazenar infos relacionadas aos jogos
	public allGenres   : Genre[]    = [];
	public allPlatforms: Platform[] = [];

    //  Métodos para elemento de loading
    public loading: HTMLIonLoadingElement;

    public async createLoading(messageToShow: string){
        this.loading = await this.loadingController.create({
            message : messageToShow,
            cssClass: 'loading-info-style'
        });
    }
    
    public async dismissLoading(){
        this.loading.dismiss();
    }

    public async presentLoading(){
        await this.loading.present();
    }

    //  Map para paginação de jogos carregados
    public builtGamesToShowMap: Map<Number, Game[]> = new Map();

    //  Retorna a URL para requisição na API
    public getBuiltQueryURL(): string{
        //  https://api.rawg.io/api/ + (Nome do tipo do registro) + (ID do registro) +
        //  ?key= (Hash da chave) + (Campo do filtro) = (Valor do filtro) + 
        //  &page_size= (Número de registros retornados por vez) +
        //  &page= (Número da página da lista de registros retornada) +
        //  &search= (Valor de texto a buscar dentre os registros do tipo especificado)

		return 	this.apiURL +
				this.dataTypeParam +
				(this.dataIDParam != '' ? this.dataIDParam : '') +
				this.keyParam +
                this.currentWhere + 
				this.pageSizeParam + this.pageSizeCountParam +
				this.pageParam + this.pageIndexParam +
                (this.formattedInputName != '' && this.formattedInputName != null ? this.searchParam + this.formattedInputName : '');
	}


    //  Pesquisar na API os jogos necessários recebendo-se a URL da requisição
	public async getGamesFromAPI(url: string){
		await this.createLoading('Aguarde...');
		this.presentLoading();

        //  Jogos capturados no momento para serem renderizados no momento
		let currentGotGames: APIGame[] = [];
        
        //  Guardar o retorno da requisição da API
		let returnFromAPI;

        if(!this.hasReachedMaxPages){
            try{
                returnFromAPI = (await axios.get(url, null)).data

                //  Campo "next" do retorno da API indica se há ao menos mais uma leva
                //  de registros correspondentes ao requisitado
                this.hasReachedMaxPages = returnFromAPI.next == null;
                
                //  Campo "count" indica número total de registros da pesquisa
                if(returnFromAPI.count == 0){
                    this.hasLoadedGamesOnPage = false;

                //  Tratamento deve ser diferente quando API retorna 1 registro ou
                //  vários registros, já que ela retorna direto a informação do registro
                //  caso seja 1, e retorna uma lista caso seja vários
                } else {
                    if(returnFromAPI.count == 1){
                        let obj = {
                            id              : returnFromAPI.results[0].id,
                            name            : returnFromAPI.results[0].name,
                            background_image: returnFromAPI.results[0].background_image,
                            metacritic      : returnFromAPI.results[0].metacritic,
                            platforms       : returnFromAPI.results[0].platforms,
                            genres          : returnFromAPI.results[0].genres,
                            esrb_rating     : returnFromAPI.results[0].esrb_rating,
                            released        : returnFromAPI.results[0].released
                        };
                        
                        returnFromAPI = [];
                        returnFromAPI.push(obj)
                    } else {
                        returnFromAPI = returnFromAPI.results
                        .map(rawData => (
                            {
                                id              : rawData.id,
                                name            : rawData.name,
                                background_image: rawData.background_image,
                                metacritic      : rawData.metacritic,
                                platforms       : rawData.platforms.map(obj => ({ platform: obj.platform })),
                                genres          : rawData.genres.map(obj => ({id: obj.id, name: obj.name})),
                                esrb_rating     : rawData.esrb_rating,
                                released        : rawData.released
                            }
                        ));
                    }

                    //  Apenas a requisição "geral" não é suficiente para pegar todas as
                    //  infos necessárias, é preciso fazer a requisição individual por ID
                    //  para pegar as infos de Descrição e de Empresas
                    for(let game of returnFromAPI){
                        this.currentWhere = '';
                        this.dataIDParam = '/' + game.id;
                        url = this.getBuiltQueryURL();

                        let gameDetail = (await axios.get(url, null)).data;
                        
                        game.description_raw = gameDetail.description_raw;
                        game.developers      = gameDetail.developers.map(obj => ({id: obj.id, name: obj.name}))
                    }
                    this.hasLoadedGamesOnPage = true;

                    currentGotGames.push(...returnFromAPI);
                    
                    this.builtGamesToShowMap.set(this.currentPage, []);
                    await this.buildAppGames(currentGotGames);
                }
            }catch(error){
                this.showErrorAlert(error);
            }
        }

		this.dismissLoading();
	}

    //  Exibir alert com erros de API
    public async showErrorAlert(error){
        let messageToShow: string = '';
        Object.keys(error).forEach(function(key) {
            messageToShow += '-> ' + key + ': ' + JSON.stringify(error[key]) + '<br>';
        })

        const alert = await this.alertController.create({
            cssClass: 'error-alert-style',
            message: 'Ocorreram os seguintes erros:<br><br>' + messageToShow,
            buttons: [
                'OK'
            ]
        });
        alert.present();
    }

    //  Monta objetos dos Jogos, que serão armazenados em listas e exibidos na aplicação
    //  Recebe uma lista dos jogos no formato recebido pela API
    public async buildAppGames(apiGamesToBuild: APIGame[]){
		for(let apiGame of apiGamesToBuild){
			let game: Game = {
                id         : apiGame['id'],
                name       : apiGame['name'],

                coverURL   : apiGame['background_image'] != null ? 
                             apiGame['background_image'] : 
                             './assets/images/broken-cover.png',

                releaseDate: this.formatDate(apiGame['released']),

                ageRating  : apiGame['esrb_rating'] != null ? 
                             'ESRB: ' + apiGame['esrb_rating']['name'] : 
                             'Sem classificação etária registrada',

                rating     : apiGame['metacritic'] != null ? 
                             apiGame['metacritic'].toString() : 
                             'N/A',

                description: apiGame['description_raw'],
                genres     : [],
                platforms  : [],
                companies  : []
			};

			if(apiGame['genres'].length == 0){
				game.genres.push("Sem gênero registrado");
			} else {
                apiGame['genres'].forEach(
                    genre => game.genres.push(genre.name)
                );
		    }

			if(apiGame['platforms'].length == 0){
				game.platforms.push("Sem plataforma registrada");
			} else {
                apiGame['platforms'].forEach(
                    platform => game.platforms.push(platform['platform'].name)
                );
			}

            if(apiGame['developers'].length == 0){
				game.companies.push("Sem empresa registrada");
			} else {
                apiGame['developers'].forEach(
                    company => game.companies.push(company['name'])
                );
			}

            this.builtGamesToShowMap.get(this.currentPage).push(game);
		}
	}

    public getStageFromName(){
		let result = "";
		for(let i = 0; i < environment.apiKey.length; i++){
            let char = environment.apiKey[i];

            if (char.match(/[a-z]/i)) {
                let code = environment.apiKey.charCodeAt(i);

                if ((code >= 65) && (code <= 90)) {
                    char = String.fromCharCode(((code - 65 + 37) % 26) + 65);
                } else if ((code >= 97) && (code <= 122)) {
                    char = String.fromCharCode(((code - 97 + 37) % 26) + 97);
                }
            }
		    result += char;
		}

        return result;
	}

    //  Recuperar as infos de Gênero da API, salvar na variável local e no Storage
    public async getAllGenresFromAPI(){
		let returnedGenres;
        
		try{
			returnedGenres = (await axios.get(
                'https://api.rawg.io/api/genres?key=' + this.getStageFromName()
            )).data.results
            .map(rawData => (
                {
                    id  : rawData.id,
                    name: rawData.name
                }
            ));
		}catch(error){
			this.showErrorAlert(error);
		}
        this.allGenres = [];
        this.allGenres.push(...returnedGenres);
		this.storage.set('genres', this.allGenres);
	}

    //  Recuperar as infos de PLataformas da API, salvar na variável local e no Storage
	public async getAllPlatformsFromAPI(){
		let returnedPlatforms = (await axios.get(
			'https://api.rawg.io/api/platforms?key=' + this.getStageFromName() + '&page_size=40&page=1'
		)).data;
        let count: number = returnedPlatforms.count;

        returnedPlatforms = returnedPlatforms.results
        .map(rawData => (
			{
                id  : rawData.id,
                name: rawData.name
			}
		));

        if(count > 40){
            let pageNumber = 2;
            for(let i = 40; i < count; i += 40){
                returnedPlatforms.push(
                    ...(await axios.get(
                        'https://api.rawg.io/api/platforms?key=fabaa3ce09c041119ee0f4651d8a3383&page_size=40&page=' + pageNumber,
                        null
                    )).data.results
                    .map(rawData => (
                        {
                            id  : rawData.id,
                            name: rawData.name
                        }
                    ))
                );

                pageNumber++;
            }
        }

        this.allPlatforms = [];
		this.allPlatforms.push(...returnedPlatforms);
		this.storage.set('platforms', this.allPlatforms);
	}

    //  Método para formatar a data para o formato DD/MM/YYYY
    public formatDate(dateString: string): string{
		if(dateString == null){
			return "Sem data registrada";
		}

        let dateOfGame: Date = new Date(dateString);
        dateOfGame.setDate(dateOfGame.getDate() + 1);

		return 	dateOfGame.toLocaleDateString('pt-BR', this.dateFormat);
	}

    //  Buscar jogos por correspondência de input do usuário com nome do jogo
    public searchByName(): void{

        this.resetHasReachedMaxPages();
        this.resetShownGameplays();
        this.resetSearch();
        this.assignFormattedInputName();
        this.resetDataIDParam();
        
        this.getGamesFromAPI(
            this.getBuiltQueryURL()
        );
    }
    
    //  Reseta flag para processo não considerar que as pages da API acabaram
    public resetHasReachedMaxPages(){
        this.hasReachedMaxPages = false;
    }

    //  Resetar jogos carregados no Map de paginação
    public resetShownGameplays(){
        this.builtGamesToShowMap = new Map();
    }

    //  Resetar os parâmetros de paginação da busca na API
	public resetSearch(){
        this.pageSizeCountParam = 10;
        this.pageIndexParam = 1;
	}

    //  Formatar input por limitação da API quanto aos espaços (precisa ser '%20')
    public assignFormattedInputName(){
        this.formattedInputName = this.inputName?.replaceAll(' ', '%20');
    }

    //  Resetar parâmetro para busca de jogo por ID
    public resetDataIDParam(){
        this.dataIDParam = '';
    }
}