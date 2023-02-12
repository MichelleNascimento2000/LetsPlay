import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { DatabaseService } from '../services/database.service';


@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})

export class HomePage {
    constructor(
        public router           : Router,
        public databaseService  : DatabaseService,
        public loadingController: LoadingController,
		public storage          : Storage
    ){}

    async ngOnInit(){

        //  Evitar recursão de execução mais de uma vez do OnInit
		if(!this.databaseService.haveAppOpened){
			await this.createLoading('Carregando informações necessárias, aguarde...');
			this.presentLoading();

            //  Se há infos no Storage, apenas atribuir variáveis locais,
            //  e depois atualizar com infos atuais da API
			if(await this.isStorageCreated()){
				await this.getAllStorageData();
                
				this.updateAllStorageData();
				
            //  Se não há infos no Storage, recuperar da API e atribuir no
            //  Storage e variáveis locais
			} else {
				await this.databaseService.getAllGenresFromAPI();
				await this.databaseService.getAllPlatformsFromAPI();

				await this.getAllStorageData();
			}
			
            this.databaseService.pageSizeCountParam = 10;
            
            //  Recuperar jogos iniciais
			await this.databaseService.getGamesFromAPI(
				this.databaseService.getBuiltQueryURL()
            );

			this.databaseService.haveAppOpened = true;

			this.dismissLoading();
		}
	}

    //  Chama métodos para armazenar no Storage os registos necessários,
    //  e os atribui novamente para as variáveis locais
    public async updateAllStorageData(){
		await this.databaseService.getAllGenresFromAPI();
		await this.databaseService.getAllPlatformsFromAPI();
		
		this.getAllStorageData();
	}

    //  Atribui os registros do Storage para as variáveis locais
	public async getAllStorageData(){
		this.databaseService.allGenres = [];
		await this.storage.get('genres').then(
			genre => this.databaseService.allGenres.push(...genre)
		);

		this.databaseService.allPlatforms = [];
		await this.storage.get('platforms').then(
			platform => this.databaseService.allPlatforms.push(...platform)
		);
	}

    //  Retornar se as duas infos (Gênero e Plataformas) estão salvas no Storage
    public async isStorageCreated(){
		return (await this.storage.keys()).length >= 2;
	}

    //  Redirecionar para a página de busca de jogos
    public redirectToGameSearching(){
		this.router.navigate(['search']);
	}

    //  Redirecionar para página de jogatinas
	public redirectToMyGameplays(){
	}


    //  Métodos para elemento de loading
    public loading: HTMLIonLoadingElement;
    
	public async createLoading(messageToShow: string){
		this.loading = await this.loadingController.create({
			message : messageToShow,
			cssClass: 'loading-info-style'
		});
	}

	public async dismissLoading(){
		this.loading.dismiss();
	}

	public async presentLoading(){
		await this.loading.present();
	}
}