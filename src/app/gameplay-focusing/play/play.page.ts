import { Component, OnInit } from '@angular/core';
import { GameplaysService } from 'src/app/services/gameplays.service';

@Component({
	selector: 'app-play',
	templateUrl: './play.page.html',
	styleUrls: ['./play.page.scss'],
})
export class PlayPage implements OnInit {

	constructor(
		public gameplaysService: GameplaysService
	){}

	ngOnInit(){}
}