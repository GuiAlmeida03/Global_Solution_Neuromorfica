import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';

const LIFSimulation = () => {
  const [scenario, setScenario] = useState('integration');
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [voltage, setVoltage] = useState(0);
  const [spikeCount, setSpikeCount] = useState(0);
  const [data, setData] = useState([]);

  // Parâmetros do modelo LIF
  const params = {
    C: 1.0,        // Capacitância (µF)
    R: 10.0,       // Resistência (MΩ)
    V_th: 1.0,     // Limiar de disparo (V)
    V_reset: 0.0,  // Voltagem de reset (V)
    dt: 0.1        // Passo de tempo (ms)
  };

  // Correntes de entrada para cada cenário
  const scenarios = {
    integration: { I_in: 0.05, name: 'Integração Simples', color: '#3b82f6' },
    leakage: { I_in: 0.0, name: 'Vazamento Ativo', color: '#f59e0b' },
    spiking: { I_in: 0.15, name: 'Disparo (Spiking)', color: '#10b981' }
  };

  const currentScenario = scenarios[scenario];
  const tau = params.R * params.C; // Constante de tempo

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTime(t => {
        const newTime = t + params.dt;
        if (newTime > 100) {
          setIsPlaying(false);
          return t;
        }
        return newTime;
      });

      setVoltage(v => {
        let newV = v;
        const I_in = currentScenario.I_in;
        
        // Equação diferencial do LIF: dV/dt = (I_in*R - V) / tau
        const dV = ((I_in * params.R - v) / tau) * params.dt;
        newV = v + dV;

        // Verificar disparo
        if (newV >= params.V_th) {
          setSpikeCount(c => c + 1);
          newV = params.V_reset;
        }

        // Atualizar dados do gráfico
        setData(prevData => {
          const newData = [...prevData, {
            time: time,
            voltage: v,
            threshold: params.V_th,
            spike: newV === params.V_reset && v >= params.V_th ? params.V_th : null
          }];
          return newData.slice(-500); // Manter últimos 500 pontos
        });

        return newV;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, time, currentScenario, tau]);

  const reset = () => {
    setIsPlaying(false);
    setTime(0);
    setVoltage(scenario === 'leakage' ? 0.7 : 0.0);
    setSpikeCount(0);
    setData([]);
  };

  const handleScenarioChange = (newScenario) => {
    setScenario(newScenario);
    setIsPlaying(false);
    setTime(0);
    setVoltage(newScenario === 'leakage' ? 0.7 : 0.0);
    setSpikeCount(0);
    setData([]);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Zap className="text-yellow-500" />
          Simulação do Neurônio LIF (Leaky Integrate-and-Fire)
        </h1>
        <p className="text-slate-600">
          Explore o comportamento dinâmico do modelo neuromórfico mais fundamental
        </p>
      </div>

      {/* Seletor de Cenários */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(scenarios).map(([key, s]) => (
          <button
            key={key}
            onClick={() => handleScenarioChange(key)}
            className={`p-4 rounded-lg font-semibold transition-all ${
              scenario === key
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                : 'bg-white text-slate-700 hover:bg-slate-50 shadow'
            }`}
          >
            <div className="text-lg">{s.name}</div>
            <div className="text-sm opacity-80">I_in = {s.I_in * 100} µA</div>
          </button>
        ))}
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              isPlaying
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            {isPlaying ? 'Pausar' : 'Iniciar'}
          </button>
          <button
            onClick={reset}
            className="px-6 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
          >
            <RotateCcw size={20} />
            Resetar
          </button>
        </div>

        <div className="flex gap-6">
          <div className="text-right">
            <div className="text-sm text-slate-600">Tempo</div>
            <div className="text-2xl font-bold text-slate-800">{time.toFixed(1)} ms</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600">Voltagem</div>
            <div className="text-2xl font-bold text-blue-600">{voltage.toFixed(3)} V</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600">Spikes</div>
            <div className="text-2xl font-bold text-green-600">{spikeCount}</div>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="time" 
              label={{ value: 'Tempo (ms)', position: 'insideBottom', offset: -5 }}
              stroke="#64748b"
            />
            <YAxis 
              label={{ value: 'Voltagem (V)', angle: -90, position: 'insideLeft' }}
              domain={[-0.1, 1.2]}
              stroke="#64748b"
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
            />
            <Legend />
            <ReferenceLine 
              y={params.V_th} 
              stroke="#ef4444" 
              strokeDasharray="5 5" 
              strokeWidth={2}
              label={{ value: 'Limiar (V_th)', fill: '#ef4444', fontWeight: 'bold' }}
            />
            <Line 
              type="monotone" 
              dataKey="voltage" 
              stroke={currentScenario.color}
              strokeWidth={2.5}
              dot={false}
              name="Potencial de Membrana"
            />
            <Line 
              type="monotone" 
              dataKey="spike" 
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ r: 6, fill: '#ef4444' }}
              name="Spike"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Informações do Cenário */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-slate-800 mb-4">
          📊 Análise do Cenário: {currentScenario.name}
        </h3>
        
        {scenario === 'integration' && (
          <div className="space-y-3 text-slate-700">
            <p className="font-semibold text-blue-600">Comportamento Observado:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Voltagem sobe exponencialmente seguindo V(t) = I_in × R × (1 - e^(-t/τ))</li>
              <li>Atinge aproximadamente 0.5V e estabiliza (equilíbrio entre entrada e vazamento)</li>
              <li><strong>Não dispara</strong>: o sinal não é forte o suficiente para atingir V_th = 1.0V</li>
            </ul>
            <p className="font-semibold text-green-600 mt-4">Interpretação Energética:</p>
            <p>O neurônio <strong>"ignora" estímulos fracos</strong>, conservando energia ao não propagar sinais irrelevantes. Apenas inputs significativos causam disparo.</p>
          </div>
        )}

        {scenario === 'leakage' && (
          <div className="space-y-3 text-slate-700">
            <p className="font-semibold text-amber-600">Comportamento Observado:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Corrente de entrada removida após integração parcial (V ≈ 0.7V)</li>
              <li>Voltagem decai exponencialmente: V(t) = V_inicial × e^(-t/τ)</li>
              <li>Retorna gradualmente a 0V com constante de tempo τ = {tau.toFixed(1)} ms</li>
              <li><strong>"Memória de curto prazo"</strong>: o neurônio "esquece" inputs anteriores</li>
            </ul>
            <p className="font-semibold text-green-600 mt-4">Interpretação Energética:</p>
            <p>Sem manutenção de estado desnecessário, o sistema retorna ao <strong>estado de baixo consumo</strong> naturalmente. O vazamento é essencial para eficiência.</p>
          </div>
        )}

        {scenario === 'spiking' && (
          <div className="space-y-3 text-slate-700">
            <p className="font-semibold text-green-600">Comportamento Observado:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Fase de Integração</strong>: V sobe exponencialmente</li>
              <li><strong>Atingimento do Limiar</strong>: V atinge V_th = 1.0V</li>
              <li><strong>Spike</strong>: Disparo instantâneo (pico vermelho)</li>
              <li><strong>Reset</strong>: V retorna imediatamente a 0V</li>
              <li><strong>Reintegração</strong>: Ciclo recomeça continuamente</li>
            </ul>
            <p className="font-semibold text-purple-600 mt-4">Frequência de Disparo:</p>
            <p>Com I_in = {currentScenario.I_in * 100} µA, observamos aproximadamente <strong>{spikeCount > 0 && time > 0 ? Math.round((spikeCount / time) * 1000) : 0} spikes/segundo</strong></p>
            <p className="font-semibold text-green-600 mt-4">Interpretação Energética:</p>
            <p>A <strong>comunicação por pulsos (spikes)</strong> é altamente eficiente — transmite informação apenas quando necessário, através de eventos discretos de baixíssima energia. Este é o fundamento da computação neuromórfica.</p>
          </div>
        )}
      </div>

      {/* Parâmetros do Modelo */}
      <div className="mt-6 bg-gradient-to-r from-slate-700 to-slate-800 text-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold mb-3">⚙️ Parâmetros do Modelo LIF</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <div className="opacity-80">Capacitância (C)</div>
            <div className="font-bold text-lg">{params.C} µF</div>
          </div>
          <div>
            <div className="opacity-80">Resistência (R)</div>
            <div className="font-bold text-lg">{params.R} MΩ</div>
          </div>
          <div>
            <div className="opacity-80">Limiar (V_th)</div>
            <div className="font-bold text-lg">{params.V_th} V</div>
          </div>
          <div>
            <div className="opacity-80">Reset (V_reset)</div>
            <div className="font-bold text-lg">{params.V_reset} V</div>
          </div>
          <div>
            <div className="opacity-80">Tau (τ = R×C)</div>
            <div className="font-bold text-lg">{tau.toFixed(1)} ms</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LIFSimulation;