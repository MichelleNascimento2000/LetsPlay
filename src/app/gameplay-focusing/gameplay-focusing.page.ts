import { Component, OnInit } from '@angular/core';
import { GameplaysService } from '../services/gameplays.service';
import { DatabaseService } from '../services/database.service';

@Component({
	selector: 'app-gameplay-focusing',
	templateUrl: './gameplay-focusing.page.html',
	styleUrls: ['./gameplay-focusing.page.scss'],
})
export class GameplayFocusingPage implements OnInit {

	constructor(
		public databaseService : DatabaseService,
        public gameplaysService: GameplaysService
	){}

	ngOnInit(){}
}