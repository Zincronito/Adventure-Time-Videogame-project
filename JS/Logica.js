window.addEventListener('load', function(){
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 1280;
    canvas.height = 720;
    let enemies = []; 
    let score = 0;
    let lives = 3;
    let gameOver = false;
    let highScore = parseInt(localStorage.getItem('adventureTimeHighScore')) || 0;
    const backgroundMuisc = this.document.getElementById('backgroundMusic');
    let isMusicPlaying = false;


    class InputHandler{
        constructor(){
            this.keys=[];
            window.addEventListener('keydown', e=>{
                if ((   e.key === 'ArrowDown' || 
                        e.key === 'ArrowUp' || 
                        e.key === 'ArrowLeft' || 
                        e.key === 'ArrowRight') 
                        && this.keys.indexOf(e.key) === -1){
                    this.keys.push(e.key);

                    if(!isMusicPlaying && backgroundMuisc){
                        backgroundMuisc.play().catch(e=> console.log("inicie el juego"));
                        isMusicPlaying = true;
                    }

                }else if (e.key === 'Enter' && gameOver) restartGame();
            });

            window.addEventListener('keyup', e=>{
                if (    e.key === 'ArrowDown' || 
                        e.key === 'ArrowUp' || 
                        e.key === 'ArrowLeft' || 
                        e.key === 'ArrowRight'){ 
                    this.keys.splice(this.keys.indexOf(e.key), 1);
                }
            });
        }

    }

    class Player {
        constructor(gameWidth, gameHeight){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.Width = 231; 
            this.height = 200;
            this.x = 100;
            this.y = this.gameHeight - this.height;
            this.image = document.getElementById('playerImage');
            this.frameX = 0;
            this.maxFrame = 11;
            this.frameY = 0; 
            this.fps = 12;
            this.frameTimer = 0;
            this.frameInterval = 1000/this.fps
            this.speed = 0;
            this.vy = 0;
            this.weight = 1;
            this.invincible = false;
            this.invincibleTimer = 0;
            this.invincibilityDuration = 1500;
        }

        restart(){
            this.x = 100;
            this.y = this.gameHeight - this.height;
            this.maxFrame = 11;
            this.frameY = 0; 
        }

        draw(context){
            // Efecto de parpadeo al ser invencible
            if (this.invincible) {
                // Parpadea cada 100ms 
                if (Math.floor(this.invincibleTimer / 100) % 2 === 0) {
                    context.globalAlpha = 0.5; //aqui es semitransparente
                } else {
                    context.globalAlpha = 1; //aqui se vuelve opaco 
                }
            }

            context.drawImage(this.image,this.frameX*this.Width,this.frameY*this.height,this.Width,this.height, this.x,this.y, this.Width,this.height); 
            //restaura para que no afecte a otros dibujos
            context.globalAlpha = 1; 
        }

        update(input, deltaTime, enemies){

        if (this.invincibleTimer > 0) {
                this.invincibleTimer -= deltaTime;
            } else {
                this.invincible = false;
            }

            //deteccion de colisiones
            enemies.forEach(enemy => {
                // Definir hitboxes más pequeños para una colisión más precisa
                // Estos valores (padding) se pueden ajustar
                const playerPadding = {
                    left: 70,
                    right: 70,
                    top: 20,
                    bottom: 10
                };
                const enemyPadding = {
                    left: 40,
                    right: 40,
                    top: 20,
                    bottom: 10
                };

                const playerHitbox = {
                    x: this.x + playerPadding.left,
                    y: this.y + playerPadding.top,
                    width: this.Width - playerPadding.left - playerPadding.right, // Ancho real: 91
                    height: this.height - playerPadding.top - playerPadding.bottom // Alto real: 170
                };

                const enemyHitbox = {
                    x: enemy.x + enemyPadding.left,
                    y: enemy.y + enemyPadding.top,
                    width: enemy.width - enemyPadding.left - enemyPadding.right, // Ancho real: 110
                    height: enemy.height - enemyPadding.top - enemyPadding.bottom // Alto real: 170
                };

                // Detección de colisión AABB (Axis-Aligned Bounding Box)
                if (
                    playerHitbox.x < enemyHitbox.x + enemyHitbox.width &&
                    playerHitbox.x + playerHitbox.width > enemyHitbox.x &&
                    playerHitbox.y < enemyHitbox.y + enemyHitbox.height &&
                    playerHitbox.y + playerHitbox.height > enemyHitbox.y &&
                    !this.invincible
                ) {
                    lives--; // <-- RESTA UNA VIDA
                    this.invincible = true;
                    this.invincibleTimer = this.invincibilityDuration;
                    // colisión detectada
                    if (lives <= 0){
                        gameOver = true; // <-- FIN DEL JUEGO SI NO QUEDAN VIDAS
                    }
                    if (score > highScore) {
                            highScore = score;
                            localStorage.setItem('adventureTimeHighScore', highScore.toString());
                        }
                }
            });
            //movimiento horizontal
            //sprite animation
            if(this.frameTimer > this.frameInterval){
                if(this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX ++;
                this.frameTimer = 0;
            }else{
                this.frameTimer += deltaTime;
            }
            
           //controls
           if (input.keys.indexOf('ArrowRight') >-1 ){
            this.speed = 5;
           } else if (input.keys.indexOf('ArrowLeft') >-1 ){
            this.speed = -5;
           } else if (input.keys.indexOf('ArrowUp') >-1 && this.onGround() ){
            this.vy -= 32;
           } else{
            this.speed = 0;
           }
           //horizontal movement
           this.x += this.speed;
           if (this.x < 0) this.x = 0;
           else if (this.x > this.gameWidth - this.Width) this.x = this.gameWidth - this.Width
           // vertical movement 
           this.y += this.vy;
           if (!this.onGround()){
               this.vy += this.weight;
               this.maxFrame = 3; //OJO QUE AQUI ANTES ERAN 4
               this.frameY = 1;
           }else{
            this.vy = 0;
            this.maxFrame = 11;
            this.frameY = 0;
           }
           if(this.y > this.gameHeight - this.height) this.y = this.gameHeight - this.height 
        }
        onGround(){
            return this.y >= this.gameHeight - this.height;
        }
    }

    class Background{
        constructor (gameWidth, gameHeight){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.image = document.getElementById('backgroundImage');
            this.x = 0;
            this.y = 0;
            this.width = 10000;
            this.height = 720;
            this.speed = 2;
        }
        draw(context){
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
            context.drawImage(this.image, this.x + this.width - this.speed, this.y, this.width, this.height);
        }

        update(){
            this.x -= this.speed;
            if (this.x <0 - this.width) this.x = 0;
        }

        restart (){
            this.x = 0;
        }

    }

    class Enemy{
        constructor(gameWidth,gameHeight){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 190;
            this.height = 200;
            this.image = document.getElementById('enemyImage');
            this.x = this.gameWidth;
            this.y = this.gameHeight - this.height;
            this.frameX = 0;
            this.maxFrame = 7;
            this.fps = 12;
            this.frameTimer = 0;
            this.frameInterval = 1000/this.fps
            this.speed = 7;
            this.markedForDeletion = false;
        }

        draw(context){
            context.drawImage(this.image,this.frameX*this.width,0,this.width,this.height, this.x, this.y, this.width, this.height);
        }

        update(deltaTime){
            if(this.frameTimer > this.frameInterval){
                if (this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX++;
                this.frameTimer = 0;
            }else{
                this.frameTimer += deltaTime;
            }
            this.x -= this.speed;
            if(this.x < 0 - this.width) {
              this.markedForDeletion = true;
              score ++;
              }
        }
    }

    function handleEnemies(deltaTime){
        if (enemyTimmer > enemyInterval + randomEnemyInterval){
            enemies.push(new Enemy(canvas.width, canvas.height));
            randomEnemyInterval = Math.random()*1000 + 500;
            enemyTimmer = 0; 
        }else{
            enemyTimmer += deltaTime;
        }
        enemies.forEach(enemy => {
            enemy.draw(ctx);
            enemy.update(deltaTime);
        });
        enemies = enemies.filter(enemy => !enemy.markedForDeletion);
    }

    function displayStatusText(context){
        context.textAlign = 'left';
        context.font = '40px helvetica';
        context.fillStyle = 'black';
        context.fillText('score:' + score,20,50);
        context.fillStyle = 'white';
        context.fillText('score:' + score,22,52);
        //aqui se imprimen las vidas en pantalla
        context.fillStyle = 'black';
        context.fillText('Vidas: ' + lives, 20, 100); // Posicionado debajo del score
        context.fillStyle = 'white';
        context.fillText('Vidas: ' + lives, 22, 102);

        context.fillStyle = 'black';
        context.fillText('High Score: ' + highScore, 20, 150); // Posicionado debajo de las vidas
        context.fillStyle = 'white';
        context.fillText('High Score: ' + highScore, 22, 152);

        if(gameOver){
            if(backgroundMuisc) backgroundMuisc.pause();
            context.textAlign = 'center';
            context.fillStyle = 'black';
            context.fillText('GAME OVER, presiona enter', canvas.width/2, 200);
            context.fillStyle = 'white';
            context.fillText('GAME OVER, presiona enter', canvas.width/2+2, 202);
        }
    }

    function restartGame(){
        player.restart();
        background.restart();
        enemies = []; 
        score = 0;
        lives = 3;
        gameOver = false;
        if (backgroundMuisc) backgroundMuisc.play();
        animate(0);
    }

    const input = new InputHandler();
    const player = new Player(canvas.width, canvas.height);
    const background = new Background(canvas.width, canvas.height);

    let lastTime = 0;
    let enemyTimmer = 0;
    let enemyInterval = 1000;
    let randomEnemyInterval = Math.random()*1000 + 500;


    function animate(timeStamp){
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        console.log(deltaTime);
        ctx.clearRect(0,0,canvas.width,canvas.height);
        background.draw(ctx);
        background.update();
        player.draw(ctx);
        player.update(input, deltaTime, enemies);
        handleEnemies(deltaTime);
        displayStatusText(ctx);
        if (!gameOver) requestAnimationFrame(animate);
    }

    animate(0);
});