

const {log,biglog,errorlog,colorize} = require("./out");
const {models} = require('./model');
const Sequelize = require('sequelize');



/**
 *Muestra la ayuda
 *
 * @param rl Objeto readline usado para implementar el CLI
 */
exports.helpCmd = (socket,rl) => {
    log(socket,"Comandos:");
    log(socket,"   h|help - Muestra esta ayuda.");
    log(socket,"   list - Listar los quizzes existentes.");
    log(socket,"   show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
    log(socket,"   add - Añadir un nuevo quiz interactivamente.");
    log(socket,"   delete <id> - Borrar el quiz indicado.");
    log(socket,"   edit <id> - Editar el quiz indicado.");
    log(socket,"   test <id> - Probar el quiz indicado.");
    log(socket,"   p|play - Jugar a preguntas aleatoriamente todos todos los quizzes.");
    log(socket,"   credits - Créditos.");
    log(socket,"   q|quit - Salir del programa.");
    rl.prompt();
};

/**
 * Terminar el programa.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */

exports.quitCmd =(socket,rl) => {
    rl.close();
    socket.end();
};

/**
 * Añade nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */

exports.addCmd = (socket,rl) => {
    makeQuestion(rl,'Introduzca una pregunta:')
        .then(q => {
            return makeQuestion(rl,'Introduzca la respuesta ')
                .then(a => {
                    return {question: q, answer:a};
                });
        })
        .then(quiz => {
            return models.quiz.create(quiz);
        })
        .then((quiz) => {
            log(socket,` ${colorize('Se ha añadido','magenta')}: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);

        })
        .catch(Sequelize.ValidationError, error => {
            errorlog(socket,'El quiz es erróneo:');
            error.errors.forEach(({message}) => errorlog(message));
        })
        .catch(error => {
            errorlog(socket,error.message);
        })
        .then(() => {
            rl.prompt();
        });
};


/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readline que implementa el CLI
 */
exports.listCmd = (socket,rl) => {
    models.quiz.findAll()
        .each(quiz => {
            log(socket,` [${colorize(quiz.id,'magenta')}]: ${quiz.question}`);
        })

        .catch(error => {
            errorlog(socket,error.message);
        })
        .then(() => {
            rl.prompt();
        });
};


/**
 *Esta función devuelve una promesa que:
 *  - Valida que se ha introducido un valor para el parametro.
 *  - Convierte el parametro en un entero.
 *Si todo va bien, la promesa se satisface y devuelve el valor de id a usar.
 * @param id Parametro con el índice a validar
 */
const validatedId = id => {

    return new Sequelize.Promise((resolve,reject) => {
        if (typeof id === "undefined"){
            reject(new Error(`Falta el parametro <id>.`));
        } else {
            id = parseInt(id) // se queda con la parte entera
            if (Number.isNaN(id)) {
                reject(new Error(`El valor del parámetro <id> no es un número.`));
            } else {
                resolve(id);
            }
        }
    });
};



/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = ( socket,rl,id )=> {
   validatedId(id)
   .then(id => models.quiz.findById(id))
       .then(quiz => {
           if (!quiz){
               throw new Error(`No existe un quiz asociado al id=${id}.`);
           }
           log(socket,` [${colorize(quiz.id,'magenta')}]:  ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);

       })
       .catch(error => {
           errorlog(socket,error.message);
       })
       .then(() => {
           rl.prompt();
       });
};


/**
 * Esta función convierte la llamada rl.question, basada en callbacks, en una
 * basada en promesas.
 *
 * Devuelve una promesa que cuando se cumple, proporciona el texto introducido
 * Entonces la llamada a then que hay que hacer, la promesa devuelta será:
 *      .then(answer => {})
 *También colorea en rojo el texto de la pregunta, usa trim
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param text Pregunta que hay que hacerle al usuario.
 */
const makeQuestion = (rl,text) => {

    return new Sequelize.Promise((resolve,reject) => {
        rl.question(colorize(text,'red'),answer => {
            resolve(answer.trim());
        });
    });
};





/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a probar.
 */

exports.testCmd = (socket,rl,id) => {
    validatedId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz =>{
            if(!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}`);
            }
                return makeQuestion(rl,quiz.question+'? ')
                    .then(resp =>{
                        if(resp.trim().toLowerCase() === quiz.answer.trim().toLowerCase()){
                            log(socket,'Su respuesta es :');
                            biglog(socket,'Correcta','green');
                        } else {
                            log(socket,'Su respuesta es :');
                            biglog(socket,'Incorrecta','red');
                        }
                    });
        })
        .catch(Sequelize.ValidationError,error => {
            errorlog(socket,'El quiz es erróneo:');
            error.errors.forEach(({message})=> errorlog(message));
        })
        .catch(error => {
            errorlog(socket,error.message);
        })
        .then(()=> {
            rl.prompt();
        });
};



/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl
 */
exports.playCmd = (socket,rl) => {
    let puntuacion = 0;
    let unresolved = [];
    models.quiz.findAll({raw : true})
        .then(quizzes => {
            unresolved = quizzes;
        })
        .then(() => {
            return recursivo();

        })
        .catch(Sequelize.ValidationError,error => {
            errorlog(socket,'El quiz es erróneo:');
            error.errors.forEach(({message}) => errorlog(message));
        })
        .catch(error => {
            errorlog(socket,error.message);
        })
        .then(() => {
            rl.prompt();
        });
    const recursivo = () => {
      return new Promise((resolve,reject) => {
          if(unresolved.length <= 0) {
              log(socket,'Ha contestado todas las preguntas, su puntuación es : ');
              biglog(socket,puntuacion,'magenta');
              resolve();
              return;
          } else {
              let id = Math.floor(Math.random()*unresolved.length);
              let pregunta = unresolved[id];
              unresolved.splice(id,1);
              validatedId(id);
              return makeQuestion(rl,pregunta.question +'? ')
                  .then(respuesta => {
                      if(respuesta.trim().toLowerCase() === pregunta.answer.toLowerCase().trim()){
                          puntuacion++;
                          log(socket,'CORRECTO - Lleva '+ puntuacion+' acierto');
                          resolve(recursivo());
                      } else {
                          log(socket,'INCORRECTO.');
                          log(socket,'Fin del juego. Su puntuación es: ');
                          biglog(socket,puntuacion,'magenta');
                          resolve();
                      }
                  })


          }
      })

    };
};



/**
 * Borra un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id CLave del quiz a borrar en el modelo.
 */

exports.deleteCmd = (socket,rl,id) => {
    validatedId(id)
        .then(id => models.quiz.destroy({where:{id}}))
        .catch(error => {
            errorlog(socket,error.message);
        })
        .then(() => {
            rl.prompt();
        });
};


/**
 * Edita un quiz del modelo
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd =(socket,rl,id)  => {
    validatedId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }

            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
            return makeQuestion(rl,'Introduzca la pregunta')
                .then(q => {
                    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
                    return makeQuestion(rl,'Introduzca la respuesta ')
                        .then(a => {
                            quiz.question =q;
                            quiz.answer = a;
                            return quiz;
                        });
                });
        })
        .then(quiz => {
            return quiz.save();
        })
        .then(quiz => {
            log(socket,`Se ha cambiado el quiz ${colorize(quiz.id,'magenta')} por : ${colorize(quiz.question)} ${colorize(' => ','magenta')}${colorize(quiz.answer)}.`);

        })
        .catch(Sequelize.ValidationError,error => {
            errorlog(socket,'El quiz es erróneo:');
            error.errors.forEach(({message}) => errorlog(message));
        })
        .catch(error => {
            errorlog(socket,error.message);
        })
        .then(() => {
            rl.prompt();
        });
};


/**
 * Muestra los nombres de los autores de la práctca.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param rl
 */
exports.creditsCmd = (socket,rl) => {
    log(socket,"Autores de la práctica.");
    log(socket,colorize('Luis Felipe Vélez Flores','green'));
    rl.prompt();
};