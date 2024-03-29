import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'home',
        loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'search',
        loadChildren: () => import('./search/search.module').then(m => m.SearchPageModule)
    },
    {
        path: 'game-searching',
        loadChildren: () => import('./game-searching/game-searching.module').then(m => m.GameSearchingPageModule)
    },
    {
        path: 'filter',
        loadChildren: () => import('./filter/filter.module').then(m => m.FilterPageModule)
    },
    {
        path: 'gameplays',
        loadChildren: () => import('./gameplays/gameplays.module').then(m => m.GameplaysPageModule)
    },
    {
        path: 'playing-games',
        loadChildren: () => import('./gameplays/playing-games/playing-games.module').then(m => m.PlayingGamesPageModule)
    },
    {
        path: 'gameplay-focusing',
        loadChildren: () => import('./gameplay-focusing/gameplay-focusing.module').then(m => m.GameplayFocusingPageModule)
    },
  {
    path: 'stages',
    loadChildren: () => import('./stages/stages.module').then( m => m.StagesPageModule)
  }




];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }
