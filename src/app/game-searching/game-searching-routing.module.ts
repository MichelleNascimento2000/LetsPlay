import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GameSearchingPage } from './game-searching.page';

const routes: Routes = [
	{
		path: ':id',
		component: GameSearchingPage
	}
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class GameSearchingPageRoutingModule { }
