

const {log,biglog,errorlog,colorize} = require("./out");
const model = require('./model');



/**
 *Muestra la ayuda
 *
 * @param rl Objeto readline usado para implementar el CLI
 */
exports.helpCmd = rl => {
    log("Comandos:");
    log("   h|help - Muestra esta ayuda.");
    log("   list - Listar los quizzes existentes.");
    log("   show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
    log("   add - Añadir un nuevo quiz interactivamente.");
    log("   delete <id> - Borrar el quiz indicado.");
    log("   edit <id> - Editar el quiz indicado.");
    log("   test <id> - Probar el quiz indicado.");
    log("   p|play - Jugar a preguntas aleatoriamente todos todos los quizzes.");
    log("   credits - Créditos.");
    log("   q|quit - Salir del programa.");
    rl.prompt();
};

/**
 * Terminar el programa.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */

exports.quitCmd =rl => {
    rl.close();
};

/**
 * Añade nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */

exports.addCmd = rl => {
    rl.question(colorize('Introduzca una pregunta: ','red'), question => {
        rl.question(colorize('Introduzca una respuesta ','red'), answer => {

            model.add(question,answer);
            log(`${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>','magenta')} ${answer}`);
            rl.prompt();
        });
    });
};


/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readline que implementa el CLI
 */
exports.listCmd = rl => {
    model.getAll().forEach((quiz,id) => {
        log(`  [${colorize(id,'magenta')}]: ${quiz.question}`);
    });
    rl.prompt();
};


/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = ( rl,id )=> {


    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {
            const quiz = model.getByIndex(id);
            log(` [${colorize(id,"magenta")}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
        } catch (error) {
            errorlog(error.message);
        }
    }
    rl.prompt();
};

/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a probar.
 */

exports.testCmd = (rl,id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);
            rl.question(colorize('¿'+quiz.question+'? ','red'), resp => {
                if (resp.trim().toLowerCase() === quiz.answer.trim().toLowerCase()){
                    log('Su respuesta es :')
                    biglog('Correcta','green');
                    rl.prompt();
                } else {
                    log('Su respuesta es :')
                    biglog('Incorrecta','red');
                    rl.prompt();
                }
            });

        } catch (error) {
            errorlog(error.message);
            rl.prompt();

        }
    }

};

/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl
 */
exports.playCmd = rl => {
    let puntuacion = 0;
    let unresolved = [];
    for (let i =0;i<model.count();i++) {
        unresolved[i] = i;
    }
    let aux = model.getAll();


    const recursivo = () => {
        if(unresolved.length === 0){
            log('Ha contestado todas las preguntas, su puntuación es : ');
            biglog(puntuacion,'magenta');
            rl.prompt();
        } else {
            let id = Math.floor(Math.random()*unresolved.length);
            unresolved.splice(id,1);
            let quiz = aux[id];
            aux.splice(id,1);
            rl.question(colorize('¿'+ quiz.question+'? ','red'), respuesta =>{
                if (respuesta.trim().toLowerCase() === quiz.answer.trim().toLowerCase()){
                    puntuacion++;
                    log('CORRECTO - Lleva '+ puntuacion +' aciertos');
                    recursivo();
                }
                else {
                    log('INCORRECTO.');
                    log('Fin del juego. '+'Su puntuación es: ');
                    biglog(puntuacion,'magenta');
                    rl.prompt();
                }
            });

        }
    }
    recursivo();
};

/**
 * Borra un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id CLave del quiz a borrar en el modelo.
 */

exports.deleteCmd = (rl,id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {
             model.deleteByIndex(id);
        } catch (error) {
            errorlog(error.message);
        }
    }

    rl.prompt();
};


/**
 * Edita un quiz del modelo
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd =(rl,id)  => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);

            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
            rl.question(colorize('Introduzca una pregunta: ','red'),question => {
                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
                rl.question(colorize('Introduzca la respuesta ','red'),answer => {
                    model.update(id,question,answer);
                    log(` Se ha cambiado el quiz ${colorize(id,"magenta")} por: ${question} ${colorize('=>','magenta')} ${answer}`);
                    rl.prompt();
                });
            });

        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }






    rl.prompt();
};


/**
 * Muestra los nombres de los autores de la práctca.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param rl
 */
exports.creditsCmd = rl => {
    log("Autores de la práctica.");
    log(colorize('Luis Felipe Vélez Flores','green'));
    log(colorize('Miguel Rubio Bravo','green'));
    rl.prompt();
};