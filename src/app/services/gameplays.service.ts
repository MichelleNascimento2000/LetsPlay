import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
	providedIn: 'root'
})
export class GameplaysService {

	constructor(
		private router: Router
	){}

	public redirectToGameDetails(gameId: number){
		this.router.navigate(['game-searching/' + gameId]);
	}
}