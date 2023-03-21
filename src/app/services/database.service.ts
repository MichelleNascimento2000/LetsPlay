import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';
import axios from "axios";
import { APIGame, Game, Genre, Platform, Company } from '../models/API-Models';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { KeyValue } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class DatabaseService {

    constructor(
		public storage          : Storage,
		public router           : Router,
		public loadingController: LoadingController,
		public alertController  : AlertController,
        public toastController  : ToastController
    ){}


    //  Evitar recursão do OnInit da home.page
	public haveAppOpened: boolean = false;

    //  Controle para exibir mensagem de "Nenhum resultado encontrado" caso não ache jogos
    public hasLoadedGamesOnPage: boolean = true;

    //  Controle para saber se todos os jogos da pesquisa na API foram exibidos no passar de páginas
    public hasReachedMaxPages: Boolean = false;

    

    //  Variáveis para formar as chamadas da API
    public apiURL             = environment.url;
    public dataTypeParam      = `games`;
    public dataIDParam        = ``;
    public keyParam           = `?key=${this.getStageFromName()}`;
    public pageSizeParam      = `&page_size=`;
    public pageSizeCountParam = 40;
    public pageParam          = `&page=`;
    public pageIndexParam     = 1;
    public searchParam        = `&search=`;
	public currentWhere       = ``;
    public formattedInputName = ``;
    public inputName;

    //  Variável para guardar as empresas buscadas durante seleção de filtro
    public searchedCompanies: Company[] = [];
    
    //  Variáveis para controle de paginação
    public currentPage: number = 1;

    //  Variável com os parâmetros para formatação de data
    public dateFormat: Intl.DateTimeFormatOptions = {
		day  : `2-digit`,
		month: `2-digit`,
		year : `numeric`
	}

    //  Variável com os parâmetros para formatação de data
	public dateTimeFormat: Intl.DateTimeFormatOptions = {
		hour  : `2-digit`,
		minute: `2-digit`,
		second: `2-digit`,
		day   : `2-digit`,
		month : `2-digit`,
		year  : `numeric`
	};

    //  Variáveis para armazenar infos relacionadas aos jogos
	public allGenres   : Genre[]    = [];
	public allPlatforms: Platform[] = [];

    //  Jogos carregados a partir dos registros de jogatinas
    public gameplayBuiltGames: Map<Number, Game> = new Map();

    //  Map para paginação de jogos carregados
    public builtGamesToShowMap: Map<Number, Game[]> = new Map();

    
    //  Variável do elemento de loading
    public loading: HTMLIonLoadingElement;

    //  Criar o loading
    public async createLoading(messageToShow: string) : Promise<void> {
        this.loading = await this.loadingController.create({
            message : messageToShow,
            cssClass: `loading-info-style`
        });
    }
    
    //  Fechar o loading
    public async dismissLoading() : Promise<void> {
        this.loading.dismiss();
    }

    //  Exibir o loading
    public async presentLoading() : Promise<void> {
        await this.loading.present();
    }

    //  Retorna a URL para requisição na API
    public getBuiltQueryURL() : string {
        //  https://api.rawg.io/api/ + (Nome do tipo do registro) + (ID do registro) +
        //  ?key= (Hash da chave) + (Campo do filtro) = (Valor do filtro) + 
        //  &page_size= (Número de registros retornados por vez) +
        //  &page= (Número da página da lista de registros retornada) +
        //  &search= (Valor de texto a buscar dentre os registros do tipo especificado)

		return 	this.apiURL +
				this.dataTypeParam +
				(Boolean(this.dataIDParam) ? this.dataIDParam : '') +
				this.keyParam +
                this.currentWhere + 
				this.pageSizeParam + this.pageSizeCountParam +
				this.pageParam + this.pageIndexParam +
                (Boolean(this.formattedInputName) ? this.searchParam + this.formattedInputName : '');
	}

    //  Pesquisar na API os jogos necessários recebendo-se a URL da requisição
	public async getGamesFromAPI(url: string){
		await this.createLoading(`Aguarde...`);
		this.presentLoading();

        //  Jogos capturados no momento para serem renderizados no momento
		const currentGotGames: APIGame[] = [];
        
        //  Guardar o retorno da requisição da API
		let returnFromAPI;

        if (!this.hasReachedMaxPages) {
            try {
                returnFromAPI = (await axios.get(url, null)).data

                //  Campo "next" do retorno da API indica se há ao menos mais uma leva
                //  de registros correspondentes ao requisitado
                this.hasReachedMaxPages = returnFromAPI.next == null;
                
                //  Campo "count" indica número total de registros da pesquisa
                if (returnFromAPI.count == 0) {
                    this.hasLoadedGamesOnPage = false;

                //  Tratamento deve ser diferente quando API retorna 1 registro ou
                //  vários registros, já que ela retorna direto a informação do registro
                //  caso seja 1, e retorna uma lista caso seja vários
                } else {
                    if (returnFromAPI.count == 1) {
                        const obj = {
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
                                platforms       : rawData.platforms?.map(obj => ({ platform: obj.platform })),
                                genres          : rawData.genres?.map(obj => ({id: obj.id, name: obj.name})),
                                esrb_rating     : rawData.esrb_rating,
                                released        : rawData.released
                            }
                        ));
                    }

                    //  Apenas a requisição "geral" não é suficiente para pegar todas as
                    //  infos necessárias, é preciso fazer a requisição individual por ID
                    //  para pegar as infos de Descrição e de Empresas
                    for(const game of returnFromAPI){
                        this.dataIDParam = `/${game.id}`;
                        url = this.getBuiltQueryURL();

                        const gameDetail = (await axios.get(url, null)).data;
                        
                        game.description_raw = gameDetail.description_raw;
                        game.developers      = gameDetail.developers.map(obj => ({id: obj.id, name: obj.name}))
                    }
                    this.hasLoadedGamesOnPage = true;

                    currentGotGames.push(...returnFromAPI);
                    
                    this.builtGamesToShowMap.set(this.currentPage, []);
                    await this.buildAppGames(currentGotGames, false);
                }
                
                this.clearFormattedInputName();
                this.assignFormattedInputName();
            } catch (error) {
                this.showErrorAlert(error);
            }
        }

		this.dismissLoading();
	}

    //  Redireciona para página de detalhes do jogo selecionado
	public redirectToGameDetails(gameId: number){
		this.router.navigate([`game-searching/` + gameId]);
    }

    //  Exibir alert com erros de API
    public async showErrorAlert(error){
        let messageToShow: string = ``;
        Object.keys(error).forEach(function(key) {
            messageToShow += `-> ${key}: ${JSON.stringify(error[key])}<br>`;
        })

        const alert = await this.alertController.create({
            cssClass: `error-alert-style`,
            message: `Ocorreram os seguintes erros:<br><br>${messageToShow}`,
            buttons: [
                `OK`
            ]
        });
        alert.present();
    }

    //  Buscar jogos por correspondência de input do usuário com nome do jogo
    public searchByName(): void {

        this.resetHasReachedMaxPages();
        this.resetShownGameplays();
        this.resetSearch();
        this.assignFormattedInputName();
        this.resetDataIDParam();
        this.resetPages();

        this.getGamesFromAPI(
            this.getBuiltQueryURL()
        );
    }
    
    //  Reseta flag para processo não considerar que as pages da API acabaram
    public resetHasReachedMaxPages() : void {
        this.hasReachedMaxPages = false;
    }

    //  Resetar jogos carregados no Map de paginação
    public resetShownGameplays() : void {
        this.builtGamesToShowMap = new Map();
    }

    //  Resetar os parâmetros de paginação da busca na API
	public resetSearch() : void {
        this.pageSizeCountParam = 10;
        this.pageIndexParam = 1;
	}

    //  Formatar input por limitação da API quanto aos espaços (precisa ser '%20')
    public assignFormattedInputName() : void {
        this.formattedInputName = this.inputName?.replaceAll(' ', '%20');
    }

    //  Resetar parâmetro para busca de jogo por ID
    public resetDataIDParam(){
        this.dataIDParam = ``;
    }

    //  Resetar input formatado de busca na API
    public clearFormattedInputName(){
        this.formattedInputName = ``;
    }

    //  Monta objetos dos Jogos, que serão armazenados em listas e exibidos na aplicação
    //  Recebe uma lista dos jogos no formato recebido pela API
	public async buildAppGames(apiGamesToBuild: APIGame[], loadingFromGameplays: boolean) : Promise<void> {
		for (const apiGame of apiGamesToBuild) {

            const apiGenres   : any[] = apiGame[`genres`];
            const apiPlatforms: any[] = apiGame[`platforms`];
            const apiCompanies: any[] = apiGame[`developers`];

			const game: Game = {
                id         : apiGame[`id`],
                name       : apiGame[`name`],

                coverURL   : Boolean(apiGame[`background_image`]) ?
                             apiGame[`background_image`] :
                             `./assets/images/broken-cover.png`,

                releaseDate: this.formatDate(apiGame[`released`]),

                ageRating  : Boolean(apiGame[`esrb_rating`]) ?
                             `ESRB: ${apiGame[`esrb_rating`][`name`]}` :
                             `Sem classificação etária registrada`,

                rating     : Boolean(apiGame[`metacritic`]) ?
                             apiGame[`metacritic`].toString() :
                             `N/A`,

                description: apiGame[`description_raw`],

                genres     : (apiGenres && apiGenres.length) ?
                             apiGenres.map(apiGenre => apiGenre[`name`]) : [`Sem gênero registrado`],
                platforms  : (apiPlatforms && apiPlatforms.length) ?
                             apiPlatforms.map(apiPlatform => apiPlatform[`platform`].name) : [`Sem plataforma registrada`],
                companies  : (apiCompanies && apiCompanies.length) ?
                             apiCompanies.map(apiCompany => apiCompany[`name`]) : [`Sem empresa registrada`]
			};

            if (!loadingFromGameplays) {
                this.builtGamesToShowMap.get(this.currentPage).push(game);
            } else {
				this.gameplayBuiltGames.set(game.id, game);
			}
		}
	}

    public getStageFromName(){
		let result = ``;
		for(let i = 0; i < environment.apiKey.length; i++){
            let char = environment.apiKey[i];

            if (char.match(/[a-z]/i)) {
                const code = environment.apiKey.charCodeAt(i);

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

    //  Recuperar as infos de Gênero da API e salvar na variável local
    public async getAllGenresFromAPI() : Promise<void> {
		let returnedGenres;
        
		try {
			returnedGenres = (await axios.get(
                `https://api.rawg.io/api/genres?key=${this.getStageFromName()}`
            )).data.results
            .map(rawData => (
                {
                    id  : rawData.id,
                    name: rawData.name
                }
            ));
		} catch (error) {
			this.showErrorAlert(error);
		}
        this.allGenres = [];
        this.allGenres.push(...returnedGenres);
	}

    //  Recuperar as infos de Plataformas da API e salvar na variável local
	public async getAllPlatformsFromAPI() : Promise<void> {
		let returnedPlatforms = (await axios.get(
			`https://api.rawg.io/api/platforms?key=${this.getStageFromName()}&page_size=40&page=1`
		)).data;
        const count: number = returnedPlatforms.count;

        returnedPlatforms = returnedPlatforms.results
        .map(rawData => (
			{
                id  : rawData.id,
                name: rawData.name
			}
		));

        if (count > 40) {
            let pageNumber = 2;
            for (let i = 40; i < count; i += 40) {
                returnedPlatforms.push(
                    ...(await axios.get(
                        `https://api.rawg.io/api/platforms?key=fabaa3ce09c041119ee0f4651d8a3383&page_size=40&page=${pageNumber}`,
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
	}

    // COMPANIES - Carregar os filtros
	public async getCompaniesFromAPIForFilter(name: string) : Promise<void> {
        await this.createLoading(`Aguarde...`);
		this.presentLoading();

        const url = 
            `https://api.rawg.io/api/developers?key=${this.getStageFromName()}&page_size=20&page=1
            ${Boolean(name) ? `&search=${name.replaceAll(` `, `%20`)}` : ``}`;
            
            let returnedCompanies;
        try {

            returnedCompanies = (await axios.get(url)).data;
            
            if (returnedCompanies.count == 1) {
                returnedCompanies.push({
                    id  : returnedCompanies.results[0].id,
                    name: returnedCompanies.results[0].name
                })
            } else {
                returnedCompanies = returnedCompanies.results
                .map(rawData => (
                    {
                        id  : rawData.id,
                        name: rawData.name
                    }
                ));
            }
		} catch (error) {
            this.showErrorAlert(error);
		}
        this.searchedCompanies = [];
        await this.searchedCompanies.push(...returnedCompanies);

        await this.dismissLoading();
	}

    //  Método para formatar a data para o formato DD/MM/YYYY
    public formatDate(dateString: string): string{
        if(dateString == null){
            return `Sem data registrada`;
        }

        const dateOfGame: Date = new Date(dateString);
        dateOfGame.setDate(dateOfGame.getDate() + 1);

        return 	dateOfGame.toLocaleDateString(`pt-BR`, this.dateFormat);
    }

    //  Ir para próxima página
    public forwardPage(){        
        if(this.hasReachedMaxPages){
            this.showSuccessErrorToast(false, `Nenhum resultado encontrado!`);
            return;
        }

        this.currentPage++;
        this.loadMore();
    }

    //  Ir para página anterior
    public backPage() : void {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    //  Carregar próxima pagina de itens
    public loadMore() : void {
        if (!this.builtGamesToShowMap.get(this.currentPage)) {
            this.resetDataIDParam();
            this.pageIndexParam++;

            this.getGamesFromAPI(
                this.getBuiltQueryURL()
            );
        }
    }

    //  Voltar página para a primeira  
    public resetPages() : void {
        this.currentPage = 1;
    }

    //  Exibir toast de Sucesso ou Erro
    public async showSuccessErrorToast(isSuccess: boolean, messageToShow: string) : Promise<void> {
        const toast = await this.toastController.create({
			cssClass: isSuccess ? `success-toast-style` : `error-toast-style`,
			position: `bottom`,
			message : messageToShow,
			animated: true,
			duration: isSuccess ? 3000 : 100000,
            buttons: [
                {
                    text: `Fechar`,
                    role: `cancel`,
                    handler: () => {}
                }
            ]
		});
		toast.present();
    }


    //  Método para passar como parâmetro no pipe do keyValue das iterações que envolvam Enum
    //  Exibe os valores na ordem inserida na classe Enum
    public originalOrder = (a: KeyValue<string, string>, b: KeyValue<string, string>) : number => {
        return 0;
    }

    //  Verificar se uma variável é diferente de null, undefined ou vazio
    //  Será usado nas camadas de HTML
    public isNotNull(param: any) : boolean {
        return Boolean(param);
    }
}