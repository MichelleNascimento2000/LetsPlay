import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { APIGame, Game, Gameplay, GameplayDetailsSections, GameplayHistory, GameplayStage, GameplayStageStatusOptions, GameplayStatusOptions, HistoryType } from '../models/API-Models';
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
    public builtGameplaysToShowMap: Map<String, Map<Number, Gameplay[]>> = new Map();
    
    //  Map com as gameplays do usuário a serem exibidas, separadas por Status e número da página de exibição
    public renderedBuiltGameplaysToShowMap: Map<String, Map<Number, Gameplay[]>> = new Map();
    
    //  Enum com os valores dos possíveis status de gameplay para exibição das tabs
    public gameplayStatusOptionsEnum = GameplayStatusOptions;

    //  Variáveis auxiliares para manipulação e construção dos Maps de exibição de Gameplays e Stages
    public pageIndexForMakingMap    = 1;
    public itemPositionForMakingMap = 0;
    
    //  Status atualmente sendo filtrado
	public progressName: string = 'Jogando';
    
    //  Página atualmente sendo exibida
	public currentPage: number = 1;
    
    //  Variável para guardar o input de texto do usuário a ser aplicado na busca de gameplays
    public gameplayTextInput: string;
    
    //  Map com os itens de histórico da gameplay a ser exibida
    public builtHistoriesToShowMap: Map<Number, GameplayHistory[]> = new Map();
    
    //  Variáveis de controle para parametrizar a função do botão de retornar da página de detalhes de um jogo
    public comingFromSearch: Boolean = false;
    
    
    
    //  Gameplay sendo exibida no momento
    public gameplayToShow: Gameplay;
    
    //  Seção da página de detalhes da gameplay sendo exibida no momento
    public gameplayDetailsSection: string = 'Fases';
    
    //  Enum com os valores das possíveis seções da página de detalhes de gameplay, para exibição das tabs
    public gameplayDetailsSectionsEnum = GameplayDetailsSections;
    
    //  Variável para guardar a fase sendo exibida/manipulada atualmente, para exibição dos seus detalhes
	public currentStage: GameplayStage;
    
    //  Map com todas as fases da gameplay atual, separadas por Status e número da página de exibição
    public builtStagesToShowMap: Map<String, Map<Number, GameplayStage[]>> = new Map();

    //  Map das fases do usuário a serem exibidas para a gameplay atual
	public renderedGameplayStagesMap: Map<Number, GameplayStage[]> = new Map();
    
    //  Status da fase atualmente sendo filtrado
	public chosenStageStatus: string = 'Todos';

    //  Fases atualmente sendo filtradas pelo seu status
	public currentFilteredStagesByStatus: GameplayStage[] = [];

    //  Input de texto a ser usado para filtrar as fases
	public stageTextInput: string;

    //  Enum com os valores dos possíveis status de uma fase
	public gameplayStageStatusOptionsEnum = GameplayStageStatusOptions;


    //  Cores dos estilos a serem usados nos cards das fases
    //  Fases "pares" serão verdes, e "ímpares" serão amarelas
    public allColorsMap = new Map([
        ['0TitleBackground', '#1b9a39bd'],
        ['1TitleBackground', '#d2af24bd'],
        ['0Font',            '#003a0e'  ],
        ['0Background',      '#1b9a3980'],
        ['1Font',            '#383a00'  ],
        ['1Background',      '#e1e42b4c']
    ]);

    //  Carregar informações dos jogos contidos dentre as gameplays salvas pelo usuário
    public async getGameplaysInfoFromAPI() : Promise<void> {
        const gameplayGames: APIGame[] = [];
        for(const gameplay of this.allGameplays){
            this.databaseService.dataIDParam = `/${gameplay.gameId}`;
            const url = this.databaseService.getBuiltQueryURL();
            
            const returnedGame = (await axios.get(url, null)).data;
            const game: APIGame = {
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
   public async confirmGameAdding(game: Game) : Promise<void> {
        const messageToShow: string =
            this.isGameAlreadyAdded(game.id) ?
            `Você já adicionou esse jogo à sua lista. Deseja realmente adicioná-lo de novo?`:
            `Deseja mesmo adicionar esse jogo à lista?`;
        
        //  Em caso de confirmação, pedir que o usuário entre com o nome
        const alert = await this.alertController.create({
            cssClass: `base-alert-style`,
            message: messageToShow,
            buttons: [
                {
                    text: `Sim`,
                    handler: () => this.askGameplayName(game)
                },
                `Não`
            ]
        });
        alert.present();
    }

    //  Verifica se o jogo já foi adicionado previamente
    public isGameAlreadyAdded(gameId: number) : boolean {
        return this.allGameplays.some(game => game.gameId == gameId);
    }

    //  Exibe alert para inserção do nome que o usuário deseja dar à gameplay
    public async askGameplayName(game: Game) : Promise<void> {

        //  Em caso de confirmação, pedir que o usuário entre com o status da gameplay
        const alert = await this.alertController.create({
            cssClass: `base-alert-style`,
            message: `Escolha um título para a sua jogatina`,
            inputs: [
                {
                    cssClass: `alert-input`,
                    name: `gameplayName`,
                    value: ``,
                    type: `text`
                }
            ],
            buttons: [
                {
                    text: `OK`,
                    handler: alertInput => this.enterGameplayStatus(game, alertInput.gameplayName)
                },
                `Cancelar`
            ]
        });
        alert.present();
    }

    //  Exibe alert para inserção do status atual da gameplay sendo adicionada
    public async enterGameplayStatus(game: Game, chosenGameplayName: string) : Promise<void> {

        //  O nome não deve estar vazio
        if(!Boolean(chosenGameplayName)){
            this.databaseService.showSuccessErrorToast(false, `Você deve inserir valores antes de continuar!`);
            this.askGameplayName(game);
            return;
        }

        //  O nome não deve ter mais de 30 caracteres (por questões de melhor visualização na página)
        if(chosenGameplayName.length > 30){
            this.databaseService.showSuccessErrorToast(false, `O título deve ter no máximo 30 caracteres!`);
            this.askGameplayName(game);
            return;
        }

        const statusesButtons: AlertInput[] = [
            {
                name: `naLista`,
                type: `radio`,
                label: GameplayStatusOptions.NaLista,
                value: GameplayStatusOptions.NaLista,
                checked: true,
                cssClass: `alert-input`
            },
            {
                name: `pausado`,
                type: `radio`,
                label: GameplayStatusOptions.Pausado,
                value: GameplayStatusOptions.Pausado,
                cssClass: `alert-input`
            },
            {
                name: `jogando`,
                type: `radio`,
                label: GameplayStatusOptions.Jogando,
                value: GameplayStatusOptions.Jogando,
                cssClass: `alert-input`
            },
            {
                name: `concluido`,
                type: `radio`,
                label: GameplayStatusOptions.Concluido,
                value: GameplayStatusOptions.Concluido,
                cssClass: `alert-input`
            },
        ];

        //  Em caso de confirmação e de validação correta, adicionar gameplay à lista de gameplays
        const alert = await this.alertController.create({
            cssClass: `base-alert-style`,
            message: `Entre com o status da gameplay`,
            inputs: statusesButtons,
            buttons: [
                {
                    text: `OK`,
                    handler: alertInputs => this.addGameToPlayList(game, alertInputs, chosenGameplayName)

                },
                `Cancelar`
            ]
        });
        alert.present();
    }

    //  Cria o objeto para a gameplay, e adiciona à lista de todas as gameplays
    //  Recebe o jogo, o status e o nome como parâmetros
    public addGameToPlayList(game: Game, chosenStatus: string, gameplayName: string) {
        const now = new Date().toLocaleDateString(`pt-BR`, this.databaseService.dateTimeFormat);
        const gameplay: Gameplay = {
            gameId                : game.id,
            gameName              : game.name,
            gameCoverURL          : game.coverURL,
            name                  : gameplayName,
            addingDate            : now,
            lastModifiedDate      : new Date(),
            oldStatus             : chosenStatus,
            status                : chosenStatus,
			stages                : [],
            stagesCreated         : 0,
            notes                 : '',
			historyItems          : []
		};

        //  Adiciona jogo em questão no Map de jogos carregados via gameplays
        this.databaseService.gameplayBuiltGames.set(game.id, game);

        //  Cria o primeiro item de histórico para a gameplay
		this.createHistoryItem(gameplay, HistoryType.CriacaoPlay, null, gameplay.name, chosenStatus);

        //  Adiciona gameplay na lista de gameplays, e no topo de todas
        this.allGameplays.unshift(gameplay);

        //  Reordena a paginação do status que teve a gameplay recém adicionada
		this.reorderMapByStatus(chosenStatus);

        //  Salvar a lista de gameplays atualizadas no Storage
        this.saveGameplaysToStorage();

        //  Atualiza Map das gameplays
        this.reassignProgressAndRepopulateGameplays(chosenStatus);

        //  Exibir Toast de sucesso
        this.databaseService.showSuccessErrorToast(true, `Gameplay criada com sucesso!`);
    }

    //  Reordena a paginação das gameplays dentro do status especificado
    public reorderMapByStatus(status: string) : void {

        //  O método começará pelo primeiro item
		this.resetItemPositionForMakingMap();
		
        //  Inicializa o Map com a lista vazia para a primeira página
		this.resetBuiltGameplaysMap(status);

        //  Chama método para reorganizar a paginação da atual lista de gameplays para o status especificado
		this.putItemsToMap(this.builtGameplaysToShowMap.get(status), this.allGameplays.filter(play => play.status == status));

        //  Popula Map de gameplays renderizadas na página com o Map total atualizado
		this.renderedBuiltGameplaysToShowMap = new Map(this.builtGameplaysToShowMap);
	}

    //  Salvar lista de todas as gameplays no Storage
    //  Caso o parâmetro venha null, considerar a lista de todas as gameplays
    public saveGameplaysToStorage(){
		this.storage.set(`gameplays`, this.allGameplays);
	}

    //  Resetar a variável auxiliar que guarda o índice da página para manipular os Maps
    public resetPageIndexForMakingMap() : void {
        this.pageIndexForMakingMap = 1;
    }

    //  Resetar a variável auxiliar que guarda a posição do item para manipular os Maps
    public resetItemPositionForMakingMap() : void {
        this.itemPositionForMakingMap = 0;
    }
    
    //  Resetar o Map de organização das gameplays
    public resetBuiltGameplaysMap(status: string) : void {
        this.builtGameplaysToShowMap.set(status, new Map([
			[1, []]
		]));
    }

    //  Popular o Map de itens com os itens de uma lista, respeitando a parametrização da paginação
    //  Adicionar itens em conjuntos de 10
    public putItemsToMap(mapToAdd: Map<any, any>, listToFilter: any[]) : void {
		
        //  O método começará pela primeira página
		this.resetPageIndexForMakingMap();

        //  O método começará pelo primeiro item
		this.resetItemPositionForMakingMap();

        //  Variável auxiliar para guardar os itens a serem adicionados
        let currentPageItems = [];

        //  Caso o status tenha sido passado, a lista deve ser filtrada por ele
        //  Caso não tenha passado, a lista inteira deve ser repassada para o Map
		for (const item of listToFilter) {
            //  Incrementar posição do item
            this.itemPositionForMakingMap++;

            //  Caso tenha chegado no 11, popular a primeira "página" de itens 
			if (this.itemPositionForMakingMap > 10){

                //  Popula página atualmente iterada com a lista montada de itens
				mapToAdd.set(this.pageIndexForMakingMap, currentPageItems);

                //  Reseta lista montada de itens
                currentPageItems = [];

                //  Incrementa índice da página
				this.pageIndexForMakingMap++;

                //  Reseta a posição do item
				this.resetItemPositionForMakingMap();
			}

            //  Adiciona item atual na lista
            currentPageItems.push(item);
		}

        //  Adiciona os restantes na página atual
        mapToAdd.set(this.pageIndexForMakingMap, currentPageItems);
	}

    //  Retorna o atual conjunto de gameplays de acordo com o status filtrado e a página atual
    public getCurrentGameplaySetToShow() : Gameplay[] {
        return this.renderedBuiltGameplaysToShowMap.get(this.progressName).get(this.currentPage);
    }

    //  Retorna se a tab passada por parâmetro é a que está selecionada atualmente
    public isTabSelected(tabValue: string, chosenValue: string) : boolean {
        return tabValue == chosenValue;
    }

    //  Atualizar status de progresso atual, e reprocessar Map das gameplays
	public reassignProgressAndRepopulateGameplays(progressName: string) : void {

        //  Atualiza variável que guarda o progresso atual
		this.progressName = progressName;

        //  Volta para a página inicial
		this.resetPages();

        //  Carrega as gameplays a serem renderizadas
		this.populateAllGameplaysToShowMap();

        //  Aplica filtro por nome
		this.searchGameplayByTextInput();
	}

    //  Popula o Map com todas as gameplays do usuário, e carrega o Map de exibição na tela filtrando por status e página
    public populateAllGameplaysToShowMap() : void {

        //  Iterar por todos os status possiveis
        for (const status of Object.values(GameplayStatusOptions)) {
            
            //  Resetar Map das gameplays paginadas
            this.resetBuiltGameplaysMap(status);

            //  Popular Map com gameplays do status atual
            this.putItemsToMap(this.builtGameplaysToShowMap.get(status), this.allGameplays.filter(play => play.status == status));
            
            //  Popular Map de gameplays a ser renderizada com o Map geral recém montado
            this.renderedBuiltGameplaysToShowMap = new Map(this.builtGameplaysToShowMap);
        }
    }

    //  Buscar gameplays por associação do texto com o nome do jogo ou da gameplay
    public searchGameplayByTextInput() : void {

        //  Se não houver input, apenas carregar todas as gameplays
		if (!Boolean(this.gameplayTextInput)) {
            this.populateAllGameplaysToShowMap();
            return;
        }

        this.resetPages();

        //  Buscar correspondência, dentre todas as gameplays do status atualmente filtrado, com nome da gameplay ou do jogo
        const input = this.formatInput(this.gameplayTextInput);
        this.populateRenderedMapWithFilteredGameplays(
            Array.from(this.builtGameplaysToShowMap.get(this.progressName).values()).flatMap(value => value)
            .filter(play => this.formatInput(play.name)    .includes(input) || 
                            this.formatInput(play.gameName).includes(input)
            )
        );
        
	}
    
    //  Exibir apenas as gameplays filtradas a partir do input textual 
    public populateRenderedMapWithFilteredGameplays(filteredGameplays: Gameplay[]) : void {

        //  Executar operação para todos os status de gameplay
		for (const status of Object.values(GameplayStatusOptions)) {

            //  Resetar gameplays atualmente exibidas
			this.resetRenderedBuiltGameplaysMap(status);

            //  Usar lista de gameplays passadas como parâmetro
			this.putItemsToMap(this.renderedBuiltGameplaysToShowMap.get(status), filteredGameplays.filter(play => play.status == status));
		}
	}

    //  Resetar o Map de exibição das gameplays filtradas a serem lançadas pontualmente na página
    public resetRenderedBuiltGameplaysMap(status: string) : void {
        this.renderedBuiltGameplaysToShowMap.set(status, new Map([
            [1, []]
        ]));
    }

    //  Formatar string recebida, retirando caracteres especiais e deixando tudo em maiúsculas
    public formatInput(input: string): string {
        return this.replaceSpecialCharactersLetters(input).toUpperCase();
    }

    //  Retirar caracteres especiais de string recebida
    public replaceSpecialCharactersLetters(text: string): string {
		return text
			.replace(`á`, `a`)
			.replace(`à`, `a`)
			.replace(`ã`, `a`)
			.replace(`â`, `a`)
			.replace(`ä`, `a`)
			.replace(`é`, `e`)
			.replace(`è`, `e`)
			.replace(`ê`, `e`)
			.replace(`ë`, `e`)
			.replace(`í`, `i`)
			.replace(`ì`, `i`)
			.replace(`î`, `i`)
			.replace(`ï`, `i`)
			.replace(`ó`, `o`)
			.replace(`ò`, `o`)
			.replace(`ô`, `o`)
			.replace(`õ`, `o`)
			.replace(`ö`, `o`)
			.replace(`ú`, `u`)
			.replace(`ù`, `u`)
			.replace(`û`, `u`)
			.replace(`ü`, `u`)
			.replace(`ñ`, `n`);
	}

    //  Cria um item de histórico de modificações para a gameplay em questão
	public createHistoryItem(gameplay: Gameplay, historyType: HistoryType, oldValue: string, newValue: string, additional: any){
        const now = new Date().toLocaleDateString(`pt-BR`, this.databaseService.dateTimeFormat);

        //  Map parametrizando cada texto de cada histórico 
        const historyTypeToTextMap: Map<HistoryType, string> = new Map([
            [HistoryType.CriacaoPlay,    `Gameplay com nome "${newValue}" e status "${additional}" criada em ${now}.`              ],
            [HistoryType.StatusPlay,     `Status da gameplay modificado de "${oldValue}" para "${newValue}" em ${now}.`            ],
            [HistoryType.AdicionarStage, `Fase com nome "${newValue}" e status "${additional}" criada em ${now}.`                  ],
            [HistoryType.DeletarStage,   `Fase com nome "${oldValue}" deletada em ${now}.`                                         ],
            [HistoryType.TituloStage,    `Fase com título modificado de "${oldValue}" para "${newValue}" em ${now}.`               ],
            [HistoryType.StatusStage,    `Status da fase "${additional}" modificado de "${oldValue}" para "${newValue}" em ${now}.`]
        ]);

        //  Adiciona no início da lista de históricos
        gameplay.historyItems.unshift({
            gameplay: gameplay,
            type    : historyType,
            text    : historyTypeToTextMap.get(historyType)
        });

        //  Carrega os históricos da gameplay em questão
		this.populateAllHistoriesToShowMap(gameplay);
	}

    //  Carregar histórico paginado de acordo com a gameplay passada como parâmetro
	public populateAllHistoriesToShowMap(gameplay: Gameplay) : void {

        //  Resetar itens de histórico atualmente exibidos
		this.resetBuiltHistoriesMap();

        //  Usar histórico da gameplay passada de parâmetro para popular o Map
		this.putItemsToMap(this.builtHistoriesToShowMap, gameplay.historyItems);
	}

    //  Resetar o Map de exibição das stages
    public resetBuiltHistoriesMap() : void {
		this.builtHistoriesToShowMap.set(1, []);
    }

    //  Exibe mensagem de confirmação para mudança de status da gameplay
    public async confirmGameStatusChange(game: Gameplay) : Promise<void> {

        //  Variáveis para controle do novo e do antigo status
        const newStatus = game.status;
        const oldStatus = game.oldStatus;

        //  Em caso de confirmação, efetuar a mudança
        const alert = await this.alertController.create({
            cssClass: `base-alert-style`,
            message: `Você deseja mesmo mudar esse jogo de "${game.oldStatus}" para "${game.status}"?`,
            buttons: [
                {
                    text: `Sim`,
                    handler: () => this.makeGameStatusChange(game, newStatus)
                },
                {
                    text: `Não`
                }
                
            ]
        });

        //  Atribui status atual com o antigo, após a mudança automática efetuada pelo próprio picklist
        //  O status não deve mudar antes da confirmação do usuário
        game.status = oldStatus;

        await alert.present();
    }


    //  Efetuar troca de status da gameplay passada pelo novo status, também recebido
    public makeGameStatusChange(game: Gameplay, newStatus: string) : void {

        //  O status antigo é o status cujas gameplays serão renderizadas na página após fim da operação
        this.progressName = game.oldStatus;
        
        game.status    = newStatus;
        game.oldStatus = game.status;
        
        //  Criar histórico para registrar mudança de status
        this.createHistoryItem(game, HistoryType.StatusPlay, this.progressName, newStatus, null);

        //  Atualizar data da última modificação da gameplay
        this.updateGameplayLastModifiedDate(game);

        this.saveGameplaysToStorage();

        this.databaseService.showSuccessErrorToast(true, `Status da gameplay alterado com sucesso!`);
    }

    //  Atualizar data da última modificação, e reordenar todas as gameplays com base nessa data
	public updateGameplayLastModifiedDate(game: Gameplay) : void {
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
	public reorderGameplaysByDate() : void {

        //  Tamanho do array de gameplays
		const length = this.allGameplays.length;

        //  Controle para ordenação cessar
		let isNotInOrder = true;

		while(isNotInOrder){
			isNotInOrder = false;

            //  Do primeiro até o penúltimo
			for (let i = 0; i < length - 1; i++) {

                //  Do segundo até o último
				for (let j = i + 1; j < length; j++) {

                    //  Comparar se todos os pares de elementos possíveis precisam ser trocados de posição 
					if (this.allGameplays[i].lastModifiedDate < this.allGameplays[j].lastModifiedDate){

                        //  Troca de posição
						const auxI = this.allGameplays[i];
						const auxJ = this.allGameplays[j];
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

    //  Exibe mensagem de confirmação para deleção de gameplay
    public async confirmGameDeletion(game: Gameplay) : Promise<void> {

        //  Em caso de confirmação, seguir com a deleção
        const alert = await this.alertController.create({
            cssClass: `base-alert-style`,
            message: `Você deseja mesmo deletar essa gameplay? Essa ação não pode ser desfeita`,
            buttons: [
                {
                    text: `Sim`,
                    handler: () => this.deleteGameplay(game)
                },
                {
                    text: `Não`
                }
                
            ]
        });
        await alert.present();
    }

    //  Deletar gameplay especificada da lista
    public async deleteGameplay(gameplay: Gameplay) : Promise<void> {
        const currentStatus: string = gameplay.status;
        this.allGameplays.splice(
            this.allGameplays.findIndex(play => play == gameplay), 1
        );
        
        //  Atualiza todas gameplays no Storage
        this.saveGameplaysToStorage();

        //  Atualiza Map das gameplays
        this.reassignProgressAndRepopulateGameplays(currentStatus);

        //  Exibe mensagem de sucesso
        this.databaseService.showSuccessErrorToast(true, `Gameplay deletada com sucesso!`);
    }

    //  Personalizar o retorno a partir da página de gameplays
    //  Ela pode ser acessada a partir da Home ou a partir da página de Busca
    public returnFromGameplaysPage(){
        this.router.navigate(this.comingFromSearch ? [`search`] : [`home`]);
    }

    //  Campo de controle para apontar qual é a página pela qual a página de gameplays foi acessada
	public setComingFromSearch(comingFromSearch: boolean) : void {
		this.comingFromSearch = comingFromSearch;
	}




    //  Carregar seção especificada da página de detalhes da gameplay
    public loadGameplayDetailsSection(gameplayDetailsSection: string) : void {
		this.resetPages();
		this.gameplayDetailsSection = gameplayDetailsSection;
	}

    //  Exibe alert para entrada das infos de nome e descrição da nova fase da gameplay atual
    public async enterNameDescription() : Promise<void> {

        //  Em caso de confirmação, prosseguir com a entrada do status da fase
		const alert = await this.alertController.create({
			cssClass: `base-alert-style`,
			message: `Entre com as informações da fase`,
			inputs: [
				{
					name: `stageName`,
					value: ``,
					type: `text`,
					placeholder: `Nome`
				},
				{
					name: `stageDescription`,
					value: ``,
					type: `text`,
					placeholder: `Descrição`
				}
			],
			buttons: [
				{
					text: `OK`,
					handler: alertInputs => this.enterStageStatus(alertInputs.stageName, alertInputs.stageDescription)

				},
				`Cancelar`
			]
		});

		alert.present();
	}

    //  Exibe alert para o usuário selecionar o status da nova fase
    public async enterStageStatus(chosenStageName: string, chosenStageDescription: string) : Promise<void> {
        
        //  O nome e a descrição enviados não podem estar vazios
        if(!Boolean(chosenStageName) || !Boolean(chosenStageDescription)){
            this.databaseService.showSuccessErrorToast(false, `Você deve inserir valores antes de continuar!`);
			this.enterNameDescription();
            return;
        }

        //  Em caso de confirmação, prosseguir com a criação da fase
        const alert = await this.alertController.create({
            cssClass: `base-alert-style`,
            message: `Entre com o status da fase`,
            inputs: [
                {
                    name: `emProgresso`,
                    type: `radio`,
                    label: GameplayStageStatusOptions.EmProgresso,
                    value: GameplayStageStatusOptions.EmProgresso,
                    checked: true,
                    cssClass: `input1`
                },
                {
                    name: `pausado`,
                    type: `radio`,
                    label: GameplayStageStatusOptions.Pausado,
                    value: GameplayStageStatusOptions.Pausado,
                    cssClass: `input1`
                },
                {
                    name: `concluido`,
                    type: `radio`,
                    label: GameplayStageStatusOptions.Concluido,
                    value: GameplayStageStatusOptions.Concluido,
                    cssClass: `input1`
                }
            ],
            buttons: [
                {
                    text: `OK`,
                    handler: alertInputs => this.addStage(chosenStageName, chosenStageDescription, alertInputs)

                },
                `Cancelar`
            ]
        });
        alert.present();
	}

    //  Criar nova fase e atribuí-la à gameplay sendo exibida
    public async addStage(chosenStageName: string, chosenStageDescription: string, chosenStatus: GameplayStageStatusOptions) : Promise<void> {
        const date = new Date();

        const stage: GameplayStage = {
            gameplay              : this.gameplayToShow,
            id                    : this.gameplayToShow.stagesCreated + 1,
            name                  : chosenStageName,
            description           : chosenStageDescription,
            status                : chosenStatus,
            oldStatus             : chosenStatus,
            createdDate           : date.toLocaleString(`pt-BR`, this.databaseService.dateTimeFormat),
            lastModifiedDateString: date.toLocaleString(`pt-BR`, this.databaseService.dateTimeFormat),
            lastModifiedDate      : date
        }

        //  Incrementa variável auxiliar na gameplay que indica quantas fases ela tem, o que é usado para criação do ID da fase
        this.gameplayToShow.stagesCreated++;

        //  Criar item de histórico para registrar criação da fase
        this.createHistoryItem(this.gameplayToShow, HistoryType.AdicionarStage, null, stage.name, chosenStatus);

        //  Adiciona fase no topo da lista de todas as fases criadas para a gameplay
        this.gameplayToShow.stages.unshift(stage)

        //  Redirecionar para a página de detalhes da fase recém criada
        this.loadStage(stage);

        //  Carrega e organiza a paginação de todas as fases agora existentes para a gameplay
        this.populateAllCurrentGameplayStagesMap();

        //  Atualiza todas gameplays no Storage
        this.saveGameplaysToStorage();

        //  Reaplicar filtragem por status e texto
        this.applyStageStatusAndTextFilter();

        //  Exibe mensagem de sucesso
        this.databaseService.showSuccessErrorToast(true, `Fase criada com sucesso!`);
    }

    //  Seta a fase atual usando a fase recebida como parâmetro, e redireciona para tela de detalhes da fase
	public loadStage(stage: GameplayStage) : void {
		this.currentStage = stage;

		this.router.navigate([`stages`]);
	}

    //  Carregar fases paginadas de acordo com cada status da fase da gameplay sendo exibida
	public populateAllCurrentGameplayStagesMap() : void {

        //  Iterar por todos os status possíveis das fases
		for (const status of Object.values(GameplayStageStatusOptions)) {
			
            //  Resetar stages atualmente exibidas
			this.resetBuiltStagesMap(status)
			
            //  Popula o Map usando todas as fases existentes para a gameplay
			this.putItemsToMap(this.builtStagesToShowMap.get(status), this.gameplayToShow.stages.filter(play => play.status == status));
		}
		
        //  Cria conjunto separado para guardar todas as fases
		this.builtStagesToShowMap.set(`Todos`, new Map([
			[1, []]
		]));
		this.putItemsToMap(this.builtStagesToShowMap.get(`Todos`), this.gameplayToShow.stages);
	}

    //  Resetar o Map de exibição das stages
    public resetBuiltStagesMap(status: string) : void {
        this.builtStagesToShowMap.set(status, new Map([
            [1, []]
        ]));
    }

    //  Aplicar mudança de status e filtro de texto às fases sendo exibidas no momento
	public applyStageStatusAndTextFilter() : void {

        //  Se o filtro for diferente de "Todos"
		if(this.chosenStageStatus != `Todos`){

            //  Filtrar fases que tenham o status escolhido no momento, e adicionar na lista
			this.currentFilteredStagesByStatus = this.gameplayToShow.stages.filter(
				stage => this.formatInput(stage.status) == this.formatInput(this.chosenStageStatus)
			);
		} else {

            //  Se for todos, carregar todas as fases independente de status
			this.loadGameplayStagesAllStatus();
		}

        //  Aplicar filtro de texto, pois ambos o de texto e o de status precisam ser aplicados juntos sempre que existentes
		this.searchStageByTextInput();
	}

    //  Aplicar filtragem das fases por input de texto, linkando com os campos de nome, descrição e ID da fase
    public searchStageByTextInput() : void {

        //  Resetar páginas pois a filtragem precisa ser exibida da primeira página pra frente
		this.resetPages();

        //  Resetar fases sendo exibidas no momento
        this.resetRenderedStagesMap();

        //  Se não há nada no input de texto, apenas exibir as fases que jã estão filtradas por status
		if (!Boolean(this.stageTextInput)) {
            this.putItemsToMap(this.renderedGameplayStagesMap, this.currentFilteredStagesByStatus);
            return;
        }

        //  Filtrar por nome, descrição ou ID
        const input = this.formatInput(this.stageTextInput);
        const textFilteredStages = this.currentFilteredStagesByStatus.filter(
            stage =>    (String)(stage.id) == this.stageTextInput || 
                        this.formatInput(stage.name).includes(input) || 
                        this.formatInput(stage.description).includes(input)
        );
        
        //  Adicionar no Map de fases renderizadas os itens recém obtidos da filtragem
        this.putItemsToMap(this.renderedGameplayStagesMap, textFilteredStages);
    }
    
    //  Carregar todas as fases da gameplay em questão no Map de fases renderizadas
    public loadGameplayStagesAllStatus() : void {

        //  Atribuir a lista puxada direto do registro da gameplay
        this.currentFilteredStagesByStatus = this.gameplayToShow.stages;
        this.putItemsToMap(this.renderedGameplayStagesMap, this.currentFilteredStagesByStatus);

        //  Resetar páginas para sempre iniciar exibição pós mudança de tab pela página 1
        this.resetPages();

        //  Preencher Map com todas as fases da gameplay atual
        this.populateAllCurrentGameplayStagesMap();
    }

    //  Retorna o atual conjunto de fases de acordo com o status e texto filtrados, e a página atual
    public resetRenderedStagesMap() : void {
        this.renderedGameplayStagesMap = new Map();
    }

    //  Retorna o atual conjunto de fases de acordo com o status e texto filtrados, e a página atual
    public getCurrentStagesSetToShow() : GameplayStage[] {
        return this.renderedGameplayStagesMap.get(this.currentPage);
    }

    //  Exibir alert com mensagem de confirmação para mudança de status da fase
	public async confirmStageStatusChange(stage: GameplayStage) : Promise<void> {

        //  Variáveis para controle do antigo e novo statuss
		const newStatus = stage.status;
		const oldStatus = stage.oldStatus;

        //  Em caso de confirmação, seguir com a mudança
		const alert = await this.alertController.create({
			cssClass: `base-alert-style`,
			message: `Você deseja mesmo mudar essa fase de "${stage.oldStatus}" para "${stage.status}"?`,
			buttons: [
				{
					text: `Sim`,
					handler: () => this.makeStageStatusChange(stage, newStatus)
				},
				{
					text: `Não`
				}
				
			]
		});

        //  Atribui status atual com o antigo, após a mudança automática efetuada pelo próprio picklist
        //  O status não deve mudar antes da confirmação do usuário
		stage.status = oldStatus;

		await alert.present();
	}

    //  Efetuar mudança de status da fase
	public makeStageStatusChange(stage: GameplayStage, newStatus: GameplayStageStatusOptions) : void {

        //  Criar item de histórico para registrar a mudança
		this.createHistoryItem(stage.gameplay, HistoryType.StatusStage, stage.status, newStatus, stage.name);

		stage.status    = newStatus;
		stage.oldStatus = stage.status;

        //  Atualizar data da última modificação da fase
		this.updateStageLastModifiedDate(stage);

		this.saveGameplaysToStorage();

		this.databaseService.showSuccessErrorToast(true, `Status da fase alterado com sucesso!`);
	}

    //  Atualizar data da última modificação, e reordenar todas as fases com base nessa data
    public updateStageLastModifiedDate(stage: GameplayStage){
        stage.lastModifiedDateString = new Date().toLocaleString(`pt-BR`, this.databaseService.dateTimeFormat);

        //  Atualizar a última modificação da gameplay também
        this.updateGameplayLastModifiedDate(stage.gameplay);

        //  Reordenação para exibir primeiro as modificadas mais recentemente
        this.reorderStagesByDate(stage);

        //  Reorganizar as fases das gameplays do status atual
        this.populateAllCurrentGameplayStagesMap();

        //  Reaplicar filtragem por status e texto
        this.applyStageStatusAndTextFilter();
    }

    //  Reordenação das fases da gameplay atual para inserir as com modificação mais recente primeiro
    //  Aplicação do Bubble Sort
	public reorderStagesByDate(stage: GameplayStage) : void {
		
        //  Todas as fases da gameplay atual
        const allStages = stage.gameplay.stages;
        
        //  Tamanho do array de gameplays
        const length = allStages.length;
		
        //  Controle para ordenação cessar
		let isNotInOrder = true;
        
		while(isNotInOrder){
			isNotInOrder = false;

            //  Do primeiro até o penúltimo
			for (let i = 0; i < length - 1; i++) {

                //  Do segundo até o último
				for (let j = i + 1; j < length; j++) {
                    
                    //  Comparar se todos os pares de elementos possíveis precisam ser trocados de posição 
					if (allStages[i].lastModifiedDate < allStages[j].lastModifiedDate){

                        //  Troca de posição
						const auxI = allStages[i];
						const auxJ = allStages[j];
						allStages[i] = auxJ;
						allStages[j] = auxI;

                        //  Será necessário refazer a varredura mais uma vez para garantir a ordenação total
						isNotInOrder = true;
					}
				}
			}
		}
	}

    //  Exibe alert de confirmação para deleção da fase
	public async confirmStageDeletion(stage: GameplayStage) : Promise<void> {
		
        //  Em caso de confirmação, prosseguir com a deleção
        const alert = await this.alertController.create({
			cssClass: `base-alert-style`,
			message: `Você deseja mesmo deletar essa fase? Essa ação não pode ser desfeita`,
			buttons: [
				{
					text: `Sim`,
					handler: () => this.deleteStage(stage)
				},
				{
					text: `Não`
				}
				
			]
		});
		await alert.present();
	}

    //  Deletar fase da gameplay
	public async deleteStage(stage: GameplayStage) : Promise<void> {

        //  Atualizar data de última modificação da gameplay
		this.updateGameplayLastModifiedDate(this.gameplayToShow);

        //  Criar item de histórico para registrar deleção
		this.createHistoryItem(stage.gameplay, HistoryType.DeletarStage, stage.name, null, null);
		
        //  Retirar fase da lista das fases da gameplay 
		this.gameplayToShow.stages.splice(
			this.gameplayToShow.stages.findIndex(s => s == stage), 1
		);

        //  Salvar atualizações no Storagte
		this.saveGameplaysToStorage();

        //  Reaplicar filtragem de status e texto às fases
		this.applyStageStatusAndTextFilter();

        //  Exibir mensagem de sucesso
		this.databaseService.showSuccessErrorToast(true, `Stage deletada com sucesso!`);
	}

    //  Método chamado para que, a cada vez que a seção de anotações é modificada, a gameplay é atualizada no Storage
    public updateGameplays() : void {

        //  Atualizar data da última modificação
		this.updateGameplayLastModifiedDate(this.gameplayToShow);

        //  Salvar tudo no Storage
		this.saveGameplaysToStorage();
	}

    //  Ação a ser realizada ao fazer importação de gameplays
    public importPlays() : void {

        //  Apenas chama o alert solicitando que o usuário entre com o texto de backup
        this.showImportExportAlert(``, true);
    }
    
    //  Ação a ser realizada ao fazer exportação de gameplays
    public exportPlays() : void {
        const gameplayObjects = [];

        //  Realiza um Stringify de todas as gameplays e os seus dados
        for (const gameplay of this.allGameplays) {
            gameplayObjects.push(JSON.stringify({
                gameId                : gameplay.gameId,
                gameName              : gameplay.gameName,
                gameCoverURL          : gameplay.gameCoverURL,
                name                  : gameplay.name,
                addingDate            : gameplay.addingDate,
                lastModifiedDate      : gameplay.lastModifiedDate,
                oldStatus             : gameplay.oldStatus,
                status                : gameplay.status,
                stagesCreated         : gameplay.stagesCreated,
                notes                 : gameplay.notes,
                stages                : gameplay.stages?.map(stage => ({
                                            id                    : stage.id,
                                            name                  : stage.name,
                                            description           : stage.description,
                                            createdDate           : stage.createdDate,
                                            lastModifiedDateString: stage.lastModifiedDateString,
                                            status                : stage.status,
                                            oldStatus             : stage.oldStatus
                                        })),
                historyItems           : gameplay.historyItems?.map(hist => ({
                                            type: hist.type,
                                            text: hist.text
                                        }))
            }));
        }
        
        //  Chama o método para exibir o alert junto com a string JSON com os dados das gameplays para o usuário copiar
        this.showImportExportAlert(`[${gameplayObjects.join(',')}]`, false);
    }

    //  Ao clicar no botão de importação ou exportação de gameplays, exibir alert de manipulação dos dados
    public async showImportExportAlert(content: string, isImport: boolean) : Promise<void> {

        //  Exibe mensagens diferentes para importação e para exportação
		const message =   isImport ? 
                        `Cole abaixo o texto com o backup das suas jogatinas.` :
                        `Copie e cole o texto abaixo em um local seguro, este é o seu backup.`;

        //  Valor a ser exibido no campo de input/output também depende do tipo de operação 
		const value = isImport ? `` : content;
    
        //  Caso seja exportação, apenas fechar o alert ao clicar OK
        //  Caso seja importação, chamar processo responsável por traduzir o JSON de backup e converter em gameplays
		const alert = await this.alertController.create({
			cssClass: `base-alert-style`,
			message: message,
			inputs: [
				{
					name: `backup`,
					value: value,
					type: `text`
				}
			],
			buttons: [
				{
					text: `OK`,
					handler:    importValue => (isImport && Boolean(importValue.backup)) ? 
                                this.makeImportProcess(importValue.backup) : alert.dismiss()
				},
			]
		});
		alert.present();
	}

	//  Realiza o processo de importação, recebendo a string JSON com todas as gameplays
	public makeImportProcess(value: string) : void {
        try {
            for (const stringObject of JSON.parse(value)) {
                const newGameplay: Gameplay = {
                    gameId                : stringObject.gameId,
                    gameName              : stringObject.gameName,
                    gameCoverURL          : stringObject.gameCoverURL,
                    name                  : stringObject.name,
                    addingDate            : stringObject.addingDate,
                    lastModifiedDate      : stringObject.lastModifiedDate,
                    oldStatus             : stringObject.oldStatus,
                    status                : stringObject.status,
                    stagesCreated         : stringObject.stagesCreated,
                    notes                 : stringObject.notes,
                    stages                : [],
                    historyItems          : []
                };

                newGameplay.stages = stringObject?.stages.map(stage => ({
                    gameplay          : newGameplay,
                    id                    : stage.id,
                    name                  : stage.name,
                    description           : stage.description,
                    createdDate           : stage.createdDate,
                    lastModifiedDateString: stage.lastModifiedDateString,
                    lastModifiedDate      : stage.lastModifiedDate,
                    status                : stage.status,
                    oldStatus             : stage.oldStatus
                }));

                newGameplay.historyItems = stringObject?.historyItems.map(hist => ({
                    play: newGameplay,
                    type: hist.type,
                    text: hist.text
                }));

                //  Adiciona nas gameplays já existentes
                this.allGameplays.unshift(newGameplay);
            }
            
            //  Atualiza o Storage
            this.storage.set('gameplays', this.allGameplays);

            //  Popula o Map das gameplays a serem exibidas
            this.populateAllGameplaysToShowMap();

            //  Exibe mensagem de sucesso
            this.databaseService.showSuccessErrorToast(true, `Sucesso ao importar!`);

        } catch (error) {

            //  Exibe mensagem de erro
            this.databaseService.showSuccessErrorToast(false, `Erro ao importar: ${error}`);
        }
	}

    //  Retorna o conjunto atual de itens, dado o tipo de item, o status e o número da página atual
    public getSetOfItemsByTypeStatusPage(itemType: string, status: string, page: number): any[]{
        if(itemType == `Gameplays`){
            return this.renderedBuiltGameplaysToShowMap.get(status).get(page);
        }

        if(itemType == `Stages`){
            return this.builtStagesToShowMap.get(status).get(page);
        }

        if(itemType == `History`){
            return this.builtHistoriesToShowMap.get(page);
        }
    }
	
    //  Ir para próxima página
	public forwardPage(pageType: string) : void {
        const status = 
            pageType == `Gameplays` ? this.progressName : 
            pageType == `Stages`    ? this.chosenStageStatus : null;

        const pageItems     = this.getSetOfItemsByTypeStatusPage(pageType, status, this.currentPage);
        const nextPageItems = this.getSetOfItemsByTypeStatusPage(pageType, status, this.currentPage + 1);
		
        if (pageItems?.length  == 10 && nextPageItems?.length > 0){
            this.currentPage++;
		}
	}
    
    //  Ir para página anterior
    public backPage() : void {
        if (this.currentPage >  1){
            this.currentPage--;
        }
    }

    //  Voltar página para a primeira  
	public resetPages() : void {
		this.currentPage = 1;
	}
}