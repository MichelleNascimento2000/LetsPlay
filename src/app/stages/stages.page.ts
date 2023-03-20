import { Component, OnInit } from '@angular/core';
import { GameplaysService } from '../services/gameplays.service';

@Component({
	selector: 'app-stages',
	templateUrl: './stages.page.html',
	styleUrls: ['./stages.page.scss'],
})
export class StagesPage implements OnInit {

	constructor(
		public gameplaysService: GameplaysService
	){}

	ngOnInit(){}
}