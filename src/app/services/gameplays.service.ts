import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Game, Gameplay, GameplayStatusOptions } from '../models/API-Models';
import { AlertController, AlertInput } from '@ionic/angular';
import { DatabaseService } from './database.service';
import { Storage } from '@ionic/storage';

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
            lastModifiedDateString: now,
            lastModifiedDate      : new Date(),
            oldStatus             : chosenStatus,
            status                : chosenStatus,
            stagesCreated         : 0,
            notes                 : ''
        };

        //  Adiciona gameplay na lista de gameplays, e no topo de todas
        this.allGameplays.unshift(gameplay);

        //  Salvar a lista de gameplays atualizadas no Storage
        this.saveGameplaysToStorage();

        //  Exibir Toast de sucesso
        this.databaseService.showSuccessErrorToast(true, 'Gameplay criada com sucesso!');

        console.log(this.allGameplays);
    }

    //  Salvar lista de todas as gameplays no Storage
    //  Caso o parâmetro venha null, considerar a lista de todas as gameplays
    public saveGameplaysToStorage(){
		this.storage.set('gameplays', this.allGameplays);
	}
}