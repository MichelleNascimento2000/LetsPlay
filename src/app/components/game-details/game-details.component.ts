import { Component, Input, OnInit } from '@angular/core';
import { Game } from 'src/app/models/API-Models';
import { GameplaysService } from 'src/app/services/gameplays.service';

@Component({
	selector: 'app-game-details',
	templateUrl: './game-details.component.html',
	styleUrls: ['./game-details.component.scss'],
})
export class GameDetailsComponent implements OnInit {

	@Input() game_to_show: Game;
	
	constructor(
		public gameplaysService: GameplaysService
	){}

	ngOnInit(){}
}