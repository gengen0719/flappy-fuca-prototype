import React, { useState, useEffect, useRef } from 'react';
import Bird from './Bird';
import Pipe from './Pipe';
import './Game.css';

const GRAVITY = 0.5;
const JUMP_HEIGHT = 10;
const PIPE_WIDTH = 60;
const PIPE_GAP = 200;
const PIPE_SPEED = 3;
const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const BIRD_WIDTH = 50;  // 鳥の画像サイズに合わせて調整
const BIRD_HEIGHT = 50; // 鳥の画像サイズに合わせて調整
const BGM_PATH = '/amega-furu-offvocal.mp3'; // BGMのパス

const Game = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [birdPosition, setBirdPosition] = useState(GAME_HEIGHT / 2);
  const [stars, setStars] = useState([]);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState([]);
  const [firstJump, setFirstJump] = useState(false); // 最初のジャンプを追跡する状態
  const gameRef = useRef(null);
  const audioRef = useRef(null);
  const frameRef = useRef();
  const pipeIntervalRef = useRef();

  // BGMの初期化と再生
  // BGMの音量調整用の関数
  const adjustBGMVolume = (volume) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume)); // 0〜1の範囲に制限
    }
  };  useEffect(() => {
    // Audio要素の作成
    audioRef.current = new Audio(BGM_PATH);
    // ループ再生は使わず、endedイベントで制御
    audioRef.current.volume = 0.5; // 音量を50%に設定
    
    // 曲が終わったら2秒後に再生を再開するイベントリスナーを設定
    const handleAudioEnd = () => {
      setTimeout(() => {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(error => {
          console.log('BGM replay failed:', error);
        });
      }, 2000); // 2秒の間隔を空ける
    };
    
    audioRef.current.addEventListener('ended', handleAudioEnd);
    
    // ゲーム開始時に再生開始
    const playBGM = () => {
      audioRef.current.play().catch(error => {
        // ブラウザによっては自動再生が制限されている場合があるため、エラーをキャッチ
        console.log('BGM autoplay failed:', error);
      });
    };
    
    // ページ読み込み時に再生開始
    playBGM();
    
    // コンポーネントのアンマウント時にクリーンアップ
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleAudioEnd);
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);  // Start the game
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setBirdPosition(GAME_HEIGHT / 2);
    setBirdVelocity(0);
    setScore(0);
    setPipes([]);
    setFirstJump(false); // ゲーム開始時に最初のジャンプ状態をリセット
    
    // ゲーム開始時にBGMを再生
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.log('BGM play failed:', error);
      });
    }
  };

  // Handle bird jump
  const handleJump = () => {
    if (!gameStarted) {
      startGame();
      return;
    }
    
    if (gameOver) {
      startGame();
      return;
    }
    
    // 最初のジャンプを記録
    if (!firstJump) {
      setFirstJump(true);
    }
    
    setBirdVelocity(-JUMP_HEIGHT);
  };

  // Handle key press
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameStarted, gameOver]);

  // Generate pipes
  useEffect(() => {
    if (gameStarted && !gameOver && firstJump) { // 最初のジャンプ後にのみパイプを生成
      const generatePipe = () => {
        const pipeHeight = Math.floor(Math.random() * (GAME_HEIGHT - PIPE_GAP - 100)) + 50;
        setPipes((currentPipes) => [
          ...currentPipes,
          {
            x: GAME_WIDTH,
            topHeight: pipeHeight,
            bottomY: pipeHeight + PIPE_GAP,
            passed: false,
          },
        ]);
      };

      pipeIntervalRef.current = setInterval(generatePipe, 2000);
      return () => clearInterval(pipeIntervalRef.current);
    }
  }, [gameStarted, gameOver, firstJump]);

  // Generate random shooting stars
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const shootingStarInterval = setInterval(() => {
        // 30% chance to create a shooting star (頻度を増加)
        if (Math.random() < 0.3) {
          const startX = Math.random() * GAME_WIDTH;
          const startY = Math.random() * (GAME_HEIGHT / 3); // Only in top third of screen
          
          const newStar = {
            id: Date.now(),
            x: startX,
            y: startY,
            duration: 2 + Math.random() * 3, // 2-5 seconds
            delay: Math.random() * 2 // 0-2 seconds delay
          };
          
          setStars(prevStars => [...prevStars, newStar]);
          
          // Remove star after animation completes
          setTimeout(() => {
            setStars(prevStars => prevStars.filter(star => star.id !== newStar.id));
          }, 5000);
        }
      }, 1000); // 間隔も2000msから1000msに短縮
      
      return () => clearInterval(shootingStarInterval);
    }
  }, [gameStarted, gameOver]);

  // Game loop
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const gameLoop = () => {
        // Update bird position
        setBirdPosition((position) => {
          // 最初のジャンプ前は鳥の位置を固定
          if (!firstJump) {
            return GAME_HEIGHT / 2;
          }
          
          const newPosition = position + birdVelocity;
          
          // Check if bird hits the ground or ceiling
          if (newPosition >= GAME_HEIGHT - BIRD_HEIGHT || newPosition <= 0) {
            setGameOver(true);
            return position;
          }
          
          return newPosition;
        });
        
        // 最初のジャンプ後のみ重力を適用
        if (firstJump) {
          // Update bird velocity (gravity)
          setBirdVelocity((velocity) => velocity + GRAVITY);
        }
        
        // Update pipes position
        setPipes((currentPipes) => {
          return currentPipes
            .map((pipe) => {
              // Check collision
              const birdRect = {
                left: 50,
                right: 50 + BIRD_WIDTH,
                top: birdPosition,
                bottom: birdPosition + BIRD_HEIGHT,
              };
              
              const topPipeRect = {
                left: pipe.x,
                right: pipe.x + PIPE_WIDTH,
                top: 0,
                bottom: pipe.topHeight,
              };
              
              const bottomPipeRect = {
                left: pipe.x,
                right: pipe.x + PIPE_WIDTH,
                top: pipe.bottomY,
                bottom: GAME_HEIGHT,
              };
              
              // Check collision with pipes
              if (
                (birdRect.right > topPipeRect.left &&
                  birdRect.left < topPipeRect.right &&
                  birdRect.top < topPipeRect.bottom) ||
                (birdRect.right > bottomPipeRect.left &&
                  birdRect.left < bottomPipeRect.right &&
                  birdRect.bottom > bottomPipeRect.top)
              ) {
                setGameOver(true);
              }
              
              // Update score when bird passes a pipe
              if (!pipe.passed && pipe.x + PIPE_WIDTH < 50) {
                setScore((s) => s + 1);
                return { ...pipe, passed: true, x: pipe.x - PIPE_SPEED };
              }
              
              return { ...pipe, x: pipe.x - PIPE_SPEED };
            })
            .filter((pipe) => pipe.x + PIPE_WIDTH > 0);
        });
        
        frameRef.current = requestAnimationFrame(gameLoop);
      };
      
      frameRef.current = requestAnimationFrame(gameLoop);
      
      return () => {
        cancelAnimationFrame(frameRef.current);
      };
    }
  }, [gameStarted, gameOver, birdPosition, birdVelocity, firstJump]);

  // Clean up on game over
  useEffect(() => {
    if (gameOver) {
      cancelAnimationFrame(frameRef.current);
      clearInterval(pipeIntervalRef.current);
      
      // ゲームオーバー時にもBGMは継続して再生
      // 必要に応じてここでBGMの音量を下げるなどの処理も可能
    }
  }, [gameOver]);

  return (
    <div 
      className="game-container" 
      ref={gameRef}
      onClick={handleJump}
      style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
    >
      <Bird position={birdPosition} />
      
      {pipes.map((pipe, index) => (
        <React.Fragment key={index}>
          <Pipe 
            x={pipe.x} 
            height={pipe.topHeight} 
            isTop={true} 
            width={PIPE_WIDTH}
          />
          <Pipe 
            x={pipe.x} 
            y={pipe.bottomY} 
            height={GAME_HEIGHT - pipe.bottomY} 
            isTop={false} 
            width={PIPE_WIDTH}
          />
        </React.Fragment>
      ))}
      
      {/* 流れ星の表示 */}
      {stars.map(star => (
        <div 
          key={star.id}
          className="shooting-star"
          style={{
            left: star.x,
            top: star.y,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`
          }}
        />
      ))}
      
      <div className="score">{score}</div>
      
      {/* BGMの音声要素 - ループ属性を削除 */}
      <audio ref={audioRef} src={BGM_PATH} preload="auto" />      {!gameStarted && (
        <div className="start-screen">
          <h1>Flappy Fuca</h1>
          <p>Click or press Space to start</p>
        </div>
      )}
      
      {gameStarted && !firstJump && !gameOver && (
        <div className="tutorial-hint">
          <p>Jump to start flying!</p>
        </div>
      )}
      
      {gameOver && (
        <div className="game-over">
          <h1>Game Over</h1>
          <p>Score: {score}</p>
          <p>Click or press Space to restart</p>
        </div>
      )}
    </div>
  );
};

export default Game;
