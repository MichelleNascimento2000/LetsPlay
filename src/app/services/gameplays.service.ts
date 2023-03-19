import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
	providedIn: 'root'
})
export class GameplaysService {

	constructor(
		private router: Router
	){}

    //  Redireciona para página de detalhes do jogo selecionado
	public redirectToGameDetails(gameId: number){
		this.router.navigate(['game-searching/' + gameId]);
	}
}