type Maybe<T> = T | null;
type ZeroOrOne = "0" | "1";
type IncrementDigit<T extends string> = `${T}${ZeroOrOne}`;
type GetLength<T extends unknown[]> = T["length"];
type LengthOfString<
  S extends string,
  C extends unknown[] = []
> = S extends `${infer F}${infer R}` ? LengthOfString<R, [...C, F]> : GetLength<C>;

type BinaryNDigits<
  N extends number = 1,
  T extends string = ""
> = LengthOfString<T> extends N ? T : BinaryNDigits<N, IncrementDigit<T>>;

type Binary<N extends number> = BinaryNDigits<N>;

/**
 * A instrução contem 20 bits,
 * sendo os primeiros 8 bits para o opcode e os últimos 12 bits para o endereço
 */
type Endereco = string;
type Instrucao = string;
type EnderecoDeUmaInstrucao = number;
/**
 * Cada palavra da memória principal do computador do IAS pode armazenar um
 * numero de 40 bits ou duas instruções de 20 bits
 */
type Palavra = string;
type EnderecoDeUmaPalavra = number;
/**
 * Registradores s ̃ao pequenas unidades de memoria que
 * se situam tipicamente pr ́oximas `as unidades logica e aritmética e de controle
 * e s ̃ao utilizadas para armazenar valores temporários
 */
type Registrador = Instrucao;


const ReadMemory = () => {
  // 1. O endereço da palavra a ser lida é escrita no Memory Address Register
  // 2. Os circuitos de controle da unidade de controle (UC) enviam um sinal de controle através de um canal de
  // comunicação de controle2 à memoria principal, solicitando a leitura do dado;
  // 3. Memoria principal le o endereço do registrador MAR, de posse do endereço, le o valor armazenado
  // da palavra de memoria associada a este endereço
  // 4. Por fim, a memoria principal grava o valor lido no registrador MBR através
  // do canal de comunicação de dados.
  MemoryBufferRegister = MemoryPrincipal[MemoryAddressRegister as number];
  return MemoryBufferRegister;
};
const WriteMemory = () => {
  // 1. O endereço da palavra que armazenar ́a o dado  ́e escrito no Memory Address Register
  // 2. O dado a ser armazenado é escrito no Memory Buffer Register
  // 3. A memoria principal le o endereço do registrador MAR através de canal de
  // comunicação de controle, le o dado do registrador MBR através do canal
  // de comunica ̧cao de dados e armazena este valor na palavra de memoria
  // associada ao endereço lido de MAR;
  MemoryPrincipal[MemoryAddressRegister as number] = MemoryBufferRegister as string;
};
const PalavraToInstrucao = (palavra: Palavra): [Instrucao, Instrucao] => {
  return [palavra.slice(0, 20), palavra.slice(20, 40)];
};
const OperacaoFromInstruction = (instruction: Maybe<Instrucao>): Binary<8> => {
  if (instruction === null) {
    throw new Error("Instrução não encontrada");
  }
  return instruction.slice(0, 8) as Binary<8>;
};
const EnderecoFromInstruction = (instruction: Instrucao) => {
  return instruction.slice(8, 20);
};

/**
 * O ciclo de busca consiste em buscar a instru ̧c ̃ao da
 * mem ́oria (ou do registrador IBR) e armazenar no IR. O ciclo de execu ̧c ̃ao, por
 * sua vez, consiste em interpretar a instru ̧c ̃ao armazenada no registrador IR e
 * realizar as opera ̧c ̃oes necess ́arias para execu ̧c ̃ao da mesma.
 */
// SearchLifeCycle
const LeftSearchLifeCycle = () => {
  MemoryAddressRegister = ProgramCounter;
  ReadMemory();
  const [left, right] = PalavraToInstrucao(MemoryBufferRegister as string);
  InstructionBufferRegister = right;
  const opLeft = OperacaoFromInstruction(left);
  InstructionRegister = opLeft;
  const enderecoLeft = parseInt(EnderecoFromInstruction(left), 2);
  MemoryAddressRegister = enderecoLeft;
};

const RightSearchLifeCycle = () => {
  // TODO: Como saber se houve desvio no fluxo de controle?
  MemoryAddressRegister = ProgramCounter;
  ReadMemory();
  const [left, right] = PalavraToInstrucao(MemoryBufferRegister as string);
  InstructionBufferRegister = right;

  const opRight = OperacaoFromInstruction(InstructionBufferRegister);
  InstructionRegister = opRight;
  const enderecoRight = parseInt(EnderecoFromInstruction(InstructionBufferRegister), 2);
  MemoryAddressRegister = enderecoRight;
  ProgramCounter++;
};

const ExecuteLifeCycle = () => {
  const op = OperacaoFromInstruction(InstructionRegister);
  switch (op) {
    // LOAD M(X)
    case "00000001":
      ReadMemory();
      Acumulador = MemoryBufferRegister;
      return;
    // LOAD MQ, M(X)
    case "00001001":
      ReadMemory();
      MultiplierQuotient = MemoryBufferRegister;
      return;
    // LOAD MQ
    case "00001010":
      Acumulador = MultiplierQuotient;
      return;
    // STOR M(X)
    case "00100001":
      WriteMemory();
      return;
    // ADD M(X)
    case "00000111":
      ReadMemory();
      ADD_ABSOLUTE();
      return;
    // SUB M(X)
    case "00000110":
      ReadMemory();

    default:
      return;
  }
};

const ADD = () => {
  if (Acumulador === null) {
    throw new Error("Acumulador não inicializado");
  }
  Acumulador = (parseInt(Acumulador, 2) + parseInt(MemoryBufferRegister as string, 2)).toString(2);
};

const ADD_ABSOLUTE = () => {
  if (Acumulador === null) {
    throw new Error("Acumulador não inicializado");
  }
  const acumulatorAsInt = parseInt(Acumulador, 2);
  const memoryBufferAsInt = parseInt(MemoryBufferRegister as string, 2);

  Acumulador = Math.abs(
  acumulatorAsInt + memoryBufferAsInt
  ).toString(2);
};

const SUB = () => {
  if (Acumulador === null) {
    throw new Error("Acumulador não inicializado");
  }
  Acumulador = (
    parseInt(Acumulador, 2) - parseInt(MemoryBufferRegister as string, 2)
  ).toString(2);
};

// Registradores
let ProgramCounter: EnderecoDeUmaInstrucao = 0;
let InstructionRegister: Maybe<Instrucao> = null;
let InstructionBufferRegister: Maybe<Instrucao> = null;
// Unidade lógica e aritmética
let MemoryAddressRegister: Maybe<EnderecoDeUmaPalavra> = null;
let MemoryBufferRegister: Maybe<Palavra> = null;
let Acumulador: Maybe<Registrador> = null;
let MultiplierQuotient: Maybe<Registrador> = null;

let MemoryPrincipal: Palavra[] = [
  // ------- Instructions -------
  // LOAD M(X) 2, ADD M(X) 3
  "0000000100000000001000000111000000000011",
  // STOR M(X) 2, LOAD M(X) 4
  "0010000100000000001000000111000000000100",
  //  ------ Data ------
  "000100",
  "000011",
]
MemoryPrincipal.forEach(inst => {
  LeftSearchLifeCycle()
  ExecuteLifeCycle()
  RightSearchLifeCycle()
  ExecuteLifeCycle()
})

