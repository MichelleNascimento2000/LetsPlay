import { Component, OnInit } from '@angular/core';
import { GameplaysService } from 'src/app/services/gameplays.service';

@Component({
	selector: 'app-playing-games',
	templateUrl: './playing-games.page.html',
	styleUrls: ['./playing-games.page.scss'],
})
export class PlayingGamesPage implements OnInit {

	constructor(
		public gameplaysService: GameplaysService
	){}

	ngOnInit(){}
}