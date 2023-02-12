import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { GameplaysService } from '../services/gameplays.service';

@Component({
	selector: 'app-search',
	templateUrl: './search.page.html',
	styleUrls: ['./search.page.scss'],
})
export class SearchPage implements OnInit {

	constructor(
		public databaseService : DatabaseService,
		public gameplaysService: GameplaysService
	){}

	ngOnInit(){}
}