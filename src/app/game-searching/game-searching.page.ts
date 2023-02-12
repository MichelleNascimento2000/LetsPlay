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
		this.game = this.databaseService.allBuiltGames.find(
			builtGame => builtGame.id == +this.idValue
		);
	}
    
    ngOnInit(){}

    public idValue = this.route.snapshot.paramMap.get('id');
	public game: Game;
}