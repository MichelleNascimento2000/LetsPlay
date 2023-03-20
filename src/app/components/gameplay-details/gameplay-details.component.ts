import { Component, Input, OnInit } from '@angular/core';
import { Gameplay } from 'src/app/models/API-Models';
import { DatabaseService } from 'src/app/services/database.service';
import { GameplaysService } from 'src/app/services/gameplays.service';

@Component({
	selector: 'app-gameplay-details',
	templateUrl: './gameplay-details.component.html',
	styleUrls: ['./gameplay-details.component.scss'],
})
export class GameplayDetailsComponent implements OnInit {
	
    @Input() gameplay_to_show: Gameplay;

	constructor(
		public gameplaysService: GameplaysService,
        public databaseService : DatabaseService
	){}

    
	ngOnInit(){
		this.gameplaysService.gameplayToShow = this.gameplay_to_show;
	}
}