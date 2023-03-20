import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { APIGame, Game, Gameplay, GameplayStatusOptions } from '../models/API-Models';
import { AlertController, AlertInput } from '@ionic/angular';
import { DatabaseService } from './database.service';
import { Storage } from '@ionic/storage';
import axios from 'axios';

@Injectable({
	providedIn: 'root'
})
export class GameplaysService {

	constructor(
		public router         : Router,
        public alertController: AlertController,
		public databaseService: DatabaseService,
        public storage        : Storage
	){}

    //  Lista corrida com todas as gameplays do usuário
    public allGameplays: Gameplay[] = [];

    //  Map com todas as gameplays do usuário organizadas, separadas por Status e número da página de exibição
    public builtGameplaysToShowMap: Map<String, Gameplay[]> = new Map();
    
    //  Map com as gameplays do usuário a serem exibidas, separadas por Status e número da página de exibição
    public renderedBuiltGameplaysToShowMap: Map<String, Gameplay[]> = new Map();
    
    //  Enum com os valores dos possíveis status de gameplay para exibição das tabs
    public gameplayStatusOptionsEnum = GameplayStatusOptions;
    
    //  Status atualmente sendo filtrado
	public progressName: string = 'Jogando';

    //  Variáveis de controle para parametrizar a função do botão de retornar da página de detalhes de um jogo
    public comingFromSearch: Boolean = false;

    //  Carregar informações dos jogos contidos dentre as gameplays salvas pelo usuário
    public async getGameplaysInfoFromAPI(){
        let gameplayGames: APIGame[] = [];
        for(let gameplay of this.allGameplays){
            this.databaseService.dataIDParam = '/' + gameplay.gameId;
            let url = this.databaseService.getBuiltQueryURL();
            
            let returnedGame = (await axios.get(url, null)).data;
            let game: APIGame = {
                id              : returnedGame.id,
                name            : returnedGame.name,
                background_image: returnedGame.background_image,
                metacritic      : returnedGame.metacritic,
                platforms       : returnedGame.platforms.map(obj => ({ platform: obj.platform })),
                genres          : returnedGame.genres.map(obj => ({id: obj.id, name: obj.name})),
                esrb_rating     : returnedGame.esrb_rating,
                released        : returnedGame.released,
                description_raw : returnedGame.description_raw,
                developers      : returnedGame.developers
            }

            await gameplayGames.push(game);
        }
        await this.databaseService.buildAppGames(gameplayGames, true);
    }

   //  Exibe alert de confirmação de adição de gameplay, com mensagens diferentes caso o jogo já tenha sido previamente adicionado
   public async confirmGameAdding(game: Game) {
        let messageToShow: string =
            this.isGameAlreadyAdded(game.id) ?
            'Você já adicionou esse jogo à sua lista. Deseja realmente adicioná-lo de novo?' :
            'Deseja mesmo adicionar esse jogo à lista?';
        
        //  Em caso de confirmação, pedir que o usuário entre com o nome
        const alert = await this.alertController.create({
            cssClass: 'base-alert-style',
            message: messageToShow,
            buttons: [
                {
                    text: 'Sim',
                    handler: () => this.askGameplayName(game)
                },
                'Não'
            ]
        });
        alert.present();
    }

    //  Verifica se o jogo já foi adicionado previamente
    public isGameAlreadyAdded(gameId: number) {
        return this.allGameplays.some(game => game.gameId == gameId);
    }

    //  Exibe alert para inserção do nome que o usuário deseja dar à gameplay
    public async askGameplayName(game: Game) {

        //  Em caso de confirmação, pedir que o usuário entre com o status da gameplay
        const alert = await this.alertController.create({
            cssClass: 'base-alert-style',
            message: 'Escolha um título para a sua jogatina',
            inputs: [
                {
                    cssClass: 'alert-input',
                    name: 'gameplayName',
                    value: '',
                    type: 'text'
                }
            ],
            buttons: [
                {
                    text: 'OK',
                    handler: alertInput => this.enterGameplayStatus(game, alertInput.gameplayName)
                },
                'Cancelar'
            ]
        });
        alert.present();
    }

    //  Exibe alert para inserção do status atual da gameplay sendo adicionada
    public async enterGameplayStatus(game: Game, chosenGameplayName: string) {

        //  O nome não deve estar vazio
        if(!Boolean(chosenGameplayName)){
            this.databaseService.showSuccessErrorToast(false, 'Você deve inserir valores antes de continuar!');
            this.askGameplayName(game);
            return;
        }

        //  O nome não deve ter mais de 30 caracteres (por questões de melhor visualização na página)
        if(chosenGameplayName.length > 30){
            this.databaseService.showSuccessErrorToast(false, 'O título deve ter no máximo 30 caracteres!');
            this.askGameplayName(game);
            return;
        }

        const statusesButtons: AlertInput[] = [
            {
                name: 'naLista',
                type: 'radio',
                label: GameplayStatusOptions.NaLista,
                value: GameplayStatusOptions.NaLista,
                checked: true,
                cssClass: 'alert-input'
            },
            {
                name: 'pausado',
                type: 'radio',
                label: GameplayStatusOptions.Pausado,
                value: GameplayStatusOptions.Pausado,
                cssClass: 'alert-input'
            },
            {
                name: 'jogando',
                type: 'radio',
                label: GameplayStatusOptions.Jogando,
                value: GameplayStatusOptions.Jogando,
                cssClass: 'alert-input'
            },
            {
                name: 'concluido',
                type: 'radio',
                label: GameplayStatusOptions.Concluido,
                value: GameplayStatusOptions.Concluido,
                cssClass: 'alert-input'
            },
        ];

        //  Em caso de confirmação e de validação correta, adicionar gameplay à lista de gameplays
        const alert = await this.alertController.create({
            cssClass: 'base-alert-style',
            message: 'Entre com o status da gameplay',
            inputs: statusesButtons,
            buttons: [
                {
                    text: 'OK',
                    handler: alertInputs => this.addGameToPlayList(game, alertInputs, chosenGameplayName)

                },
                'Cancelar'
            ]
        });
        alert.present();
    }

    //  Cria o objeto para a gameplay, e adiciona à lista de todas as gameplays
    //  Recebe o jogo, o status e o nome como parâmetros
    public addGameToPlayList(game: Game, chosenStatus: string, gameplayName: string) {
        let now = new Date().toLocaleDateString('pt-BR', this.databaseService.dateTimeFormat);
        let gameplay: Gameplay = {
            gameId                : game.id,
            gameName              : game.name,
            gameCoverURL          : game.coverURL,
            name                  : gameplayName,
            addingDate            : now,
            lastModifiedDate      : new Date(),
            oldStatus             : chosenStatus,
            status                : chosenStatus,
            stagesCreated         : 0,
            notes                 : ''
        };

        //  Adiciona jogo em questão no Map de jogos carregados via gameplays
        this.databaseService.gameplayBuiltGames.set(game.id, game);

        //  Adiciona gameplay na lista de gameplays, e no topo de todas
        this.allGameplays.unshift(gameplay);

        //  Salvar a lista de gameplays atualizadas no Storage
        this.saveGameplaysToStorage();

        //  Exibir Toast de sucesso
        this.databaseService.showSuccessErrorToast(true, 'Gameplay criada com sucesso!');
    }

    //  Salvar lista de todas as gameplays no Storage
    //  Caso o parâmetro venha null, considerar a lista de todas as gameplays
    public saveGameplaysToStorage(){
		this.storage.set('gameplays', this.allGameplays);
	}

    //  Resetar o Map de organização das gameplays
    public resetBuiltGameplaysMap(status: string){
        this.builtGameplaysToShowMap.set(status, []);
    }

    //  Retorna o atual conjunto de gameplays de acordo com o status filtrado e a página atual
    public getCurrentGameplaySetToShow(){
        return this.renderedBuiltGameplaysToShowMap.get(this.progressName);
    }

    //  Retorna se a tab passada por parâmetro é a que está selecionada atualmente
    public isTabSelected(tabValue: string, chosenValue: string){
        return tabValue == chosenValue;
    }

    //  Atualizar status de progresso atual, e reprocessar Map das gameplays
	public reassignProgressAndRepopulateGameplays(progressName: string) {

        //  Atualiza variável que guarda o progresso atual
		this.progressName = progressName;

        //  Carrega as gameplays a serem renderizadas
		this.populateAllGameplaysToShowMap();
	}

    //  Popula o Map com todas as gameplays do usuário, e carrega o Map de exibição na tela filtrando por status e página
    public populateAllGameplaysToShowMap(){

        //  Iterar por todos os status possiveis
        for(let status of Object.values(GameplayStatusOptions)){
            
            //  Resetar Map das gameplays paginadas
            this.resetBuiltGameplaysMap(status);

            //  Adicionar gameplays ao Map de exibição
    		for(let gameplay of this.allGameplays.filter(gameplay => gameplay.status == status)){
                this.builtGameplaysToShowMap.get(status).push(gameplay);
            }
            
            //  Popular Map de gameplays a ser renderizada com o Map geral recém montado
            this.renderedBuiltGameplaysToShowMap = new Map(this.builtGameplaysToShowMap);
        }
    }

    //  Exibe mensagem de confirmação para mudança de status da gameplay
    public async confirmGameStatusChange(game: Gameplay) {

        //  Variáveis para controle do novo e do antigo status
        let newStatus = game.status;
        let oldStatus = game.oldStatus;

        //  Em caso de confirmação, efetuar a mudança
        const alert = await this.alertController.create({
            cssClass: 'base-alert-style',
            message: `Você deseja mesmo mudar esse jogo de "${game.oldStatus}" para "${game.status}"?`,
            buttons: [
                {
                    text: 'Sim',
                    handler: () => this.makeGameStatusChange(game, newStatus)
                },
                {
                    text: 'Não'
                }
                
            ]
        });

        //  Atribui status atual com o antigo, após a mudança automática efetuada pelo próprio picklist
        //  O status não deve mudar antes da confirmação do usuário
        game.status = oldStatus;

        await alert.present();
    }


    //  Efetuar troca de status da gameplay passada pelo novo status, também recebido
    public makeGameStatusChange(game: Gameplay, newStatus: string){

        //  O status antigo é o status cujas gameplays serão renderizadas na página após fim da operação
        this.progressName = game.oldStatus;
        
        game.status    = newStatus;
        game.oldStatus = game.status;
        
        //  Atualizar data da última modificação da gameplay
        this.updateGameplayLastModifiedDate(game);

        this.saveGameplaysToStorage();

        this.databaseService.showSuccessErrorToast(true, 'Status da gameplay alterado com sucesso!');
    }

    //  Atualizar data da última modificação, e reordenar todas as gameplays com base nessa data
	public updateGameplayLastModifiedDate(game: Gameplay){
		game.lastModifiedDate = new Date();

        //  Reordenação para exibir primeiro as modificadas mais recentemente
		this.reorderGameplaysByDate();

        //  Carregar as gameplays do status atual
		this.reassignProgressAndRepopulateGameplays(this.progressName);

        //  Atualizar lista de gameplays no Storage
        this.saveGameplaysToStorage();
	}

    //  Reordenação das gameplays para inserir as com modificação mais recente primeiro
    //  Aplicação do Bubble Sort
	public reorderGameplaysByDate(){

        //  Tamanho do array de gameplays
		let length = this.allGameplays.length;

        //  Controle para ordenação cessar
		let isNotInOrder = true;

		while(isNotInOrder){
			isNotInOrder = false;

            //  Do primeiro até o penúltimo
			for(let i = 0; i < length - 1; i++){

                //  Do segundo até o último
				for(let j = i + 1; j < length; j++){

                    //  Comparar se todos os pares de elementos possíveis precisam ser trocados de posição
					if(this.allGameplays[i].lastModifiedDate < this.allGameplays[j].lastModifiedDate){

                        //  Troca de posição
						let auxI = this.allGameplays[i];
						let auxJ = this.allGameplays[j];
						this.allGameplays[i] = auxJ;
						this.allGameplays[j] = auxI;

                        //  Será necessário refazer a varredura mais uma vez para garantir a ordenação total
						isNotInOrder = true;
					}
				}
			}
		}
         
		this.populateAllGameplaysToShowMap();
	}

    //  Personalizar o retorno a partir da página de gameplays
    //  Ela pode ser acessada a partir da Home ou a partir da página de Busca
    public returnFromGameplaysPage(){
        this.router.navigate(this.comingFromSearch ? ['search'] : ['home']);
    }

    //  Campo de controle para apontar qual é a página pela qual a página de gameplays foi acessada
	public setComingFromSearch(comingFromSearch){
		this.comingFromSearch = comingFromSearch;
	}
}