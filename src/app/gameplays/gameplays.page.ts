import { Component, OnInit } from '@angular/core';
import { GameplaysService } from '../services/gameplays.service';
import { DatabaseService } from '../services/database.service';

@Component({
	selector: 'app-gameplays',
	templateUrl: './gameplays.page.html',
	styleUrls: ['./gameplays.page.scss'],
})
export class GameplaysPage implements OnInit {

	constructor(
        public databaseService : DatabaseService,
		public gameplaysService: GameplaysService
	){}

	ngOnInit(){}
}