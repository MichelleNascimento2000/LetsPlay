import { Component, OnInit } from '@angular/core';
import { Game } from '../models/API-Models';
import { DatabaseService } from '../services/database.service';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'app-game-searching',
	templateUrl: './game-searching.page.html',
	styleUrls: ['./game-searching.page.scss'],
})
export class GameSearchingPage implements OnInit {

	constructor(
		private route           : ActivatedRoute,
		private databaseService : DatabaseService
    ){
        //  Busca na lista dos jogos carregados na página qual jogo carregar para exibição individual
        this.game = [].concat(...this.databaseService.builtGamesToShowMap.values()).find(
            builtGame => builtGame.id == +this.idValue
        );
        
        //  Se não encontrar na lista principal, busca pela lista exclusiva de jogos das gameplays existentes
        if (this.game == null) {
            this.game = Array.from(this.databaseService.gameplayBuiltGames.values()).find(
                builtGame => builtGame.id == +this.idValue
            );
        }
    }

	ngOnInit(){}

    //  ID do jogo, que é passado como parâmetro na URL
	public idValue = this.route.snapshot.paramMap.get('id');
	public game: Game;
}