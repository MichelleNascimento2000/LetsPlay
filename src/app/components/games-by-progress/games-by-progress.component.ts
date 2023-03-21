import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Gameplay } from 'src/app/models/API-Models';
import { DatabaseService } from 'src/app/services/database.service';
import { GameplaysService } from 'src/app/services/gameplays.service';

@Component({
	selector: 'app-games-by-progress',
	templateUrl: './games-by-progress.component.html',
	styleUrls: ['./games-by-progress.component.scss'],
})
export class GamesByProgressComponent implements OnInit {

	constructor(
		public router          : Router,
		public databaseService : DatabaseService,
		public gameplaysService: GameplaysService
	){}

	ngOnInit(){

        //  Redireciona para a aba "Jogando" ao chegar na página pela primeira vez
		this.gameplaysService.reassignProgressAndRepopulateGameplays('Jogando');
	}

    //  Redirecionar para a gameplay selecionada
	public redirectToChosenGameplay(gameplay: Gameplay) : void {
		this.gameplaysService.gameplayToShow = gameplay;
		this.router.navigate(['gameplay-focusing/play']);
	}
}