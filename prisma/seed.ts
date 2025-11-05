import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedTopic = {
  id: number;
  title: string;
  contentText: string;
  tags: string[];
  displayContent: Prisma.JsonArray;
};

const lessonsData: Array<{
  id: number;
  title: string;
  topics: SeedTopic[];
}> = [
  {
    id: 1,
    title: 'Intro to Boolean Algebra',
    topics: [
      {
        id: 1,
        title: 'What is Boolean Algebra?',
        contentText:
          'Boolean algebra is a mathematical framework that deals with binary variables and logical operations, forming the foundation of digital logic and computer science.',
        tags: ['fundamentals', 'theory', 'introduction'],
        displayContent: [
          {
            type: 'text',
            text: 'Boolean algebra is a mathematical framework that deals with binary variables and logical operations. Named after mathematician George Boole (1815-1864), it forms the foundation of digital logic and computer science.',
          },
          {
            type: 'callout',
            callout: {
              type: 'info',
              title: 'Historical Context',
              content:
                'George Boole developed this algebra in the mid-1800s to formalize logic and reasoning. Little did he know it would become the backbone of all digital technology!',
            },
          },
          {
            type: 'text',
            text: 'Unlike regular algebra that works with numbers, Boolean algebra operates on a simple principle:',
          },
          {
            type: 'callout',
            callout: {
              type: 'important',
              title: 'Core Principle',
              content: 'Boolean algebra operates on only two possible values: TRUE (1) and FALSE (0). Everything else is built from these two states.',
            },
          },
          {
            type: 'text',
            text: 'The fundamental components that make Boolean algebra powerful include:',
          },
          {
            type: 'list',
            list: [
              {
                text: '<strong>Boolean Variables</strong>: Can only hold values true (1) or false (0)',
                subItems: [
                  'Often represented as letters: A, B, C, X, Y, Z',
                  "Example: Let A = 'Door is locked' (True/False)",
                  "Example: Let B = 'Key is present' (True/False)",
                ],
              },
              {
                text: '<strong>Logical Operations</strong>: Mathematical operations that combine Boolean values',
                subItems: [
                  'AND (∧): Both conditions must be true',
                  'OR (∨): At least one condition must be true',
                  'NOT (¬): Flips true to false and vice versa',
                ],
              },
              {
                text: '<strong>Boolean Expressions</strong>: Combinations of variables and operations',
                subItems: [
                  'Simple: A AND B',
                  'Complex: (A AND B) OR (NOT C AND D)',
                  "Real example: 'Can enter room' = 'Door unlocked' OR ('Door locked' AND 'Have key')",
                ],
              },
            ],
          },
          {
            type: 'text',
            text: 'Why is Boolean Algebra So Important?',
          },
          {
            type: 'list',
            list: [
              'Digital Circuits: Every computer chip uses Boolean logic',
              'Programming: All if-statements and loops use Boolean expressions',
              'Database Systems: Search queries use Boolean operators',
              'Artificial Intelligence: Decision-making algorithms rely on Boolean logic',
              'Internet Search: Boolean operators help produce relevant results',
            ],
          },
          {
            type: 'formula',
            formula: 'Boolean Value ∈ {0, 1} or {False, True}',
          },
          {
            type: 'text',
            text: 'Real-World Analogy: Think of Boolean algebra like a series of light switches. Each switch is either ON or OFF (no dimming allowed). You can wire switches together to create complex lighting systems - some lights turn on when ALL switches are ON (AND logic), others turn on when ANY switch is ON (OR logic), and some turn on when a switch is OFF (NOT logic).',
          },
          {
            type: 'callout',
            callout: {
              type: 'tip',
              title: 'Learning Path',
              content:
                "Don't worry if this seems abstract now! As we progress through Boolean values, logic gates, and truth tables, you'll see how these concepts connect to build everything from simple calculators to artificial intelligence systems.",
            },
          },
        ] as Prisma.JsonArray,
      },
      {
        id: 2,
        title: 'Boolean Values',
        contentText:
          'Boolean values are the simplest form of data in Boolean algebra, representing binary states with only two possible values: true (1) and false (0).',
        tags: ['fundamentals', 'binary', 'data-types'],
        displayContent: [
          {
            type: 'text',
            text: 'Boolean values are the atomic building blocks of Boolean algebra. Unlike numbers that can have infinite values, Boolean values are beautifully simple - they can only be one of two things.',
          },
          {
            type: 'table',
            table: {
              caption: 'Boolean Value Representations Across Different Contexts',
              headers: ['Binary', 'Boolean', 'Logical', 'Physical', 'Programming', 'Everyday'],
              rows: [
                ['1', 'True', 'Yes', 'On/High/5V', 'true', 'Success/Present/Valid'],
                ['0', 'False', 'No', 'Off/Low/0V', 'false', 'Failure/Absent/Invalid'],
              ],
            },
          },
          {
            type: 'callout',
            callout: {
              type: 'tip',
              title: 'Universal Binary Concept',
              content:
                'Boolean values appear everywhere in technology and life: light switches (on/off), doors (open/closed), tests (pass/fail), network connections (connected/disconnected).',
            },
          },
          {
            type: 'text',
            text: 'Boolean Values in Different Programming Languages:',
          },
          {
            type: 'codeBlock',
            language: 'javascript',
            code: `// JavaScript
const isLoggedIn = true;      // Boolean true
const hasPermission = false;  // Boolean false
const canAccess = isLoggedIn && hasPermission; // false
const needsLogin = !isLoggedIn;                // false

// Comparison operations return Boolean values
const age = 18;
const isAdult = age >= 18;    // true
const isChild = age < 13;     // false`,
          },
          {
            type: 'codeBlock',
            language: 'python',
            code: `# Python
is_logged_in = True       # Boolean True
has_permission = False    # Boolean False
can_access = is_logged_in and has_permission  # False
needs_login = not is_logged_in                # False

# Python treats many values as Boolean
if "hello":     # Non-empty string is True
    print("This will print")

if not 0:       # Zero is False, so 'not 0' is True
    print("This will also print")`,
          },
          {
            type: 'text',
            text: 'Boolean Operations with Truth Values:',
          },
          {
            type: 'table',
            table: {
              caption: 'Basic Boolean Operations',
              headers: ['Operation', 'Symbol', 'Example', 'Result', 'Explanation'],
              rows: [
                ['AND', '∧ or &&', 'True AND False', 'False', 'Both must be true'],
                ['OR', '∨ or ||', 'True OR False', 'True', 'At least one must be true'],
                ['NOT', '¬ or !', 'NOT True', 'False', 'Flips the value'],
              ],
            },
          },
          {
            type: 'text',
            text: 'Practical Boolean Examples in Daily Life:',
          },
          {
            type: 'list',
            list: [
              {
                text: '<strong>Security System</strong>: "Sound alarm" = "Motion detected" AND "System armed"',
                subItems: [
                  'Motion detected = True, System armed = True → Sound alarm = True',
                  'Motion detected = True, System armed = False → Sound alarm = False',
                ],
              },
              {
                text: '<strong>Online Shopping</strong>: "Can checkout" = "Items in cart" AND "Payment method added"',
                subItems: [
                  'Both conditions must be True to proceed',
                  "Missing either condition results in False (can't checkout)",
                ],
              },
              {
                text: '<strong>Weather App</strong>: "Umbrella needed" = "Rain forecast" OR "Snow forecast"',
                subItems: [
                  'Either rain OR snow (or both) means you need an umbrella',
                  'Only sunny weather means no umbrella needed',
                ],
              },
            ],
          },
          {
            type: 'callout',
            callout: {
              type: 'important',
              title: 'Memory Aid',
              content:
                "Think of Boolean values like a coin flip - it's either heads or tails, never both, never neither, and never 'sort of heads'. This absolute nature makes Boolean logic incredibly powerful for decision-making.",
            },
          },
          {
            type: 'text',
            text: 'Boolean Values in Circuit Design:',
          },
          {
            type: 'text',
            text: 'In electronic circuits, Boolean values are represented by voltage levels:',
          },
          {
            type: 'table',
            table: {
              caption: 'Boolean Values in Digital Circuits',
              headers: ['Boolean Value', 'Voltage Range', 'Logic Level', 'LED Example'],
              rows: [
                ['True (1)', '3.3V - 5V', 'HIGH', 'LED ON'],
                ['False (0)', '0V - 0.8V', 'LOW', 'LED OFF'],
              ],
            },
          },
          {
            type: 'callout',
            callout: {
              type: 'tip',
              title: 'Next Steps',
              content:
                'Now that you understand Boolean values, you are ready to see how they combine through logic operations. These combinations form the basis of all digital computation!',
            },
          },
        ] as Prisma.JsonArray,
      },
      {
        id: 3,
        title: 'Applications of Boolean Algebra',
        contentText:
          'Boolean algebra has widespread applications across multiple fields including computer science, electrical engineering, mathematics, and everyday technology systems.',
        tags: ['applications', 'real-world', 'examples'],
        displayContent: [
          {
            type: 'text',
            text: "Boolean algebra isn't just theoretical mathematics - it's the invisible foundation powering almost every aspect of modern technology. Let's explore how Boolean logic shapes our digital world.",
          },
          {
            type: 'callout',
            callout: {
              type: 'important',
              title: 'Ubiquity of Boolean Logic',
              content:
                'From the smartphone in your pocket to the traffic lights on your street, Boolean algebra is working behind the scenes, making billions of true/false decisions every second.',
            },
          },
          {
            type: 'text',
            text: 'Major Application Areas:',
          },
          {
            type: 'table',
            table: {
              caption: 'Boolean Algebra Applications Across Industries',
              headers: ['Field', 'Primary Applications', 'Specific Examples', 'Impact'],
              rows: [
                ['Computer Science', 'Programming logic, algorithms, AI', 'if-statements, loops, search algorithms, neural networks', 'Enables all software development'],
                ['Electrical Engineering', 'Digital circuit design, processors', 'Logic gates, CPUs, memory chips, microcontrollers', 'Foundation of all digital hardware'],
                ['Telecommunications', 'Data transmission, error correction', 'Network routing, signal processing, encryption', 'Enables internet and mobile networks'],
                ['Database Systems', 'Query optimization, indexing', 'SQL WHERE clauses, search optimization', 'Powers data retrieval and storage'],
                ['Artificial Intelligence', 'Decision trees, expert systems', 'Machine learning algorithms, automated reasoning', 'Enables intelligent systems'],
                ['Control Systems', 'Industrial automation, robotics', 'Manufacturing control, autonomous vehicles', 'Automates complex processes'],
              ],
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'text',
            text: 'Deep Dive: Computer Programming Applications',
          },
          {
            type: 'text',
            text: 'Every programming language relies heavily on Boolean algebra for decision-making:',
          },
          {
            type: 'codeBlock',
            language: 'javascript',
            code: `// Boolean logic in conditional statements
function canDrive(age, hasLicense, hasInsurance) {
    return age >= 16 && hasLicense && hasInsurance;
}

// Boolean logic in loops
function processQueue(queue) {
    while (queue.length > 0 && !systemOverloaded) {
        processNextItem(queue.pop());
    }
}

// Boolean logic in data filtering
const adults = users.filter(user =>
    user.age >= 18 && user.verified && !user.suspended
);

// Boolean logic in authentication
function authenticate(username, password) {
    const user = findUser(username);
    return user &&
           user.active &&
           hashPassword(password) === user.passwordHash;
}`,
          },
          {
            type: 'text',
            text: 'Deep Dive: Search Engine Technology',
          },
          {
            type: 'text',
            text: 'Search engines use Boolean logic extensively to interpret user intent and rank results:',
          },
          {
            type: 'list',
            list: [
              {
                text: '<strong>Query Processing</strong>: Converting natural language to Boolean expressions',
                subItems: [
                  '"cats AND dogs" finds pages with both terms',
                  '"vacation OR holiday" finds pages with either term',
                  '"recipe NOT spicy" finds recipes excluding spicy ones',
                ],
              },
              {
                text: '<strong>Relevance Ranking</strong>: Multiple Boolean conditions determine result order',
                subItems: [
                  'Page contains exact phrase AND is from trusted domain',
                  'Recent publication date OR high click-through rate',
                  'User location matches content AND language preference',
                ],
              },
            ],
          },
          {
            type: 'text',
            text: 'Everyday Technology Examples:',
          },
          {
            type: 'list',
            list: [
              {
                text: '<strong>Smart Home Systems</strong>',
                subItems: [
                  'Turn on lights = (Motion detected AND Dark outside) OR Manual override',
                  'Security alert = (Door opened AND System armed AND NOT authorized user)',
                  'Energy saving = (Nobody home OR Bedtime) AND NOT extreme weather',
                ],
              },
              {
                text: '<strong>Automotive Systems</strong>',
                subItems: [
                  'Airbag deployment = Severe impact AND Seatbelt fastened AND Engine running',
                  'Auto-braking = Obstacle detected AND Speed > threshold AND Driver NOT braking',
                  'Lane departure = Crossing line AND NOT turn signal AND Hands on wheel',
                ],
              },
              {
                text: '<strong>Medical Devices</strong>',
                subItems: [
                  'Pacemaker activation = Heart rate < threshold OR Irregular rhythm detected',
                  'Insulin pump = Blood glucose > target AND Time since last dose > interval',
                  'Emergency alert = Vital signs abnormal AND Patient NOT responding',
                ],
              },
            ],
          },
          {
            type: 'callout',
            callout: {
              type: 'tip',
              title: 'Industry Growth',
              content:
                'The demand for Boolean logic expertise is growing with IoT, AI, and edge computing. Understanding these fundamentals opens doors to careers in software development, hardware design, data science, and AI engineering.',
            },
          },
          {
            type: 'text',
            text: 'Future Applications:',
          },
          {
            type: 'list',
            list: [
              'Quantum Computing: Quantum Boolean logic with qubits',
              'Edge AI: Boolean optimization for low-power AI chips',
              'Autonomous Systems: Complex Boolean decision trees for self-driving cars',
              'Blockchain: Boolean verification of distributed consensus algorithms',
              'Bioinformatics: DNA sequence analysis using Boolean pattern matching',
            ],
          },
          {
            type: 'callout',
            callout: {
              type: 'important',
              title: 'Foundation Principle',
              content:
                'Remember: every complex digital system, no matter how sophisticated, ultimately breaks down to millions or billions of simple Boolean decisions. Master the fundamentals, and you understand the building blocks of all digital technology.',
            },
          },
        ] as Prisma.JsonArray,
      },
    ],
  },
  {
    id: 2,
    title: 'Logic Gates',
    topics: [
      {
        id: 4,
        title: 'AND, OR, NOT',
        contentText:
          'Logic gates are the physical implementation of Boolean operations in digital circuits, with AND, OR, and NOT being the three fundamental gates that form the basis of all digital logic.',
        tags: ['logic-gates', 'hardware', 'fundamentals'],
        displayContent: [
          {
            type: 'text',
            text: 'Logic gates are the physical building blocks of digital circuits—they are electronic components that take Boolean inputs and produce Boolean outputs according to specific logical rules.',
          },
          {
            type: 'callout',
            callout: {
              type: 'info',
              title: 'From Theory to Reality',
              content:
                'Logic gates transform abstract Boolean algebra into tangible electronic circuits that power every digital device you use.',
            },
          },
          {
            type: 'text',
            text: 'What Makes a Logic Gate?',
          },
          {
            type: 'table',
            table: {
              caption: 'Basic Logic Gates Overview',
              headers: ['Gate', 'Symbol', 'Boolean Operation', 'Minimum Inputs', 'Description', 'Real-world Analogy'],
              rows: [
                ['AND', '•', 'A ∧ B', '2', 'Output is 1 only when ALL inputs are 1', 'Series circuit - all switches must be closed'],
                ['OR', '+', 'A ∨ B', '2', 'Output is 1 when ANY input is 1', 'Parallel circuit - any switch can complete circuit'],
                ['NOT', '¬', '¬A', '1', 'Output is opposite of input', 'Inverter - flips the signal'],
              ],
            },
          },
          {
            type: 'text',
            text: 'AND Gate - Detailed Analysis',
          },
          {
            type: 'table',
            table: {
              caption: 'AND Gate Truth Table with Analysis',
              headers: ['Input A', 'Input B', 'Output', 'Voltage A', 'Voltage B', 'Output Voltage', 'Explanation'],
              rows: [
                ['0', '0', '0', '0V', '0V', '0V', 'No inputs active → No output'],
                ['0', '1', '0', '0V', '5V', '0V', 'Only one input active → No output'],
                ['1', '0', '0', '5V', '0V', '0V', 'Only one input active → No output'],
                ['1', '1', '1', '5V', '5V', '5V', 'Both inputs active → Output active'],
              ],
            },
          },
          {
            type: 'codeBlock',
            language: 'javascript',
            code: `// AND gate behavior in software
function andGate(inputA, inputB) {
    return inputA && inputB;
}

console.log(andGate(false, false)); // false
console.log(andGate(false, true));  // false
console.log(andGate(true, false));  // false
console.log(andGate(true, true));   // true`,
          },
          {
            type: 'text',
            text: 'OR Gate - Detailed Analysis',
          },
          {
            type: 'table',
            table: {
              caption: 'OR Gate Truth Table with Analysis',
              headers: ['Input A', 'Input B', 'Output', 'Voltage A', 'Voltage B', 'Output Voltage', 'Explanation'],
              rows: [
                ['0', '0', '0', '0V', '0V', '0V', 'No inputs active → No output'],
                ['0', '1', '1', '0V', '5V', '5V', 'One input active → Output active'],
                ['1', '0', '1', '5V', '0V', '5V', 'One input active → Output active'],
                ['1', '1', '1', '5V', '5V', '5V', 'Both inputs active → Output active'],
              ],
            },
          },
          {
            type: 'text',
            text: 'NOT Gate - Detailed Analysis',
          },
          {
            type: 'table',
            table: {
              caption: 'NOT Gate Truth Table with Analysis',
              headers: ['Input A', 'Output', 'Voltage In', 'Voltage Out', 'Explanation'],
              rows: [
                ['0', '1', '0V', '5V', 'Low input → High output'],
                ['1', '0', '5V', '0V', 'High input → Low output'],
              ],
            },
          },
          {
            type: 'callout',
            callout: {
              type: 'tip',
              title: 'Gate Combinations',
              content: 'Complex digital systems are built by combining these simple gates. A modern processor contains billions of these basic gates working together to perform complex operations.',
            },
          },
        ] as Prisma.JsonArray,
      },
      {
        id: 5,
        title: 'NAND, NOR',
        contentText:
          'NAND and NOR gates are compound gates that combine basic operations with NOT. They are particularly important because they are universal gates—any Boolean function can be implemented using only NAND gates or only NOR gates.',
        tags: ['logic-gates', 'compound', 'universal-gates'],
        displayContent: [
          {
            type: 'text',
            text: 'NAND and NOR gates are powerful compound gates that combine basic Boolean operations with negation. Their universality makes them invaluable in digital circuit design and manufacturing.',
          },
          {
            type: 'callout',
            callout: {
              type: 'important',
              title: 'Universal Gates',
              content:
                'NAND and NOR are called "universal gates" because they can implement any Boolean function by themselves. Designers can build entire systems using just one gate type.',
            },
          },
          {
            type: 'table',
            table: {
              caption: 'Compound Gates Overview',
              headers: ['Gate', 'Full Name', 'Symbol', 'Operation', 'Equivalent Circuit'],
              rows: [
                ['NAND', 'Not AND', '↑', '¬(A ∧ B)', 'AND gate followed by NOT gate'],
                ['NOR', 'Not OR', '↓', '¬(A ∨ B)', 'OR gate followed by NOT gate'],
              ],
            },
          },
          {
            type: 'text',
            text: 'NAND Gate - Detailed Analysis',
          },
          {
            type: 'table',
            table: {
              caption: 'NAND Gate Truth Table with Step-by-Step Analysis',
              headers: ['A', 'B', 'A AND B', 'NAND Output', 'Explanation'],
              rows: [
                ['0', '0', '0', '1', 'NOT(0) = 1'],
                ['0', '1', '0', '1', 'NOT(0) = 1'],
                ['1', '0', '0', '1', 'NOT(0) = 1'],
                ['1', '1', '1', '0', 'NOT(1) = 0'],
              ],
            },
          },
          {
            type: 'codeBlock',
            language: 'javascript',
            code: `function nandGate(a, b) {
    return !(a && b);
}

console.log(nandGate(false, false)); // true
console.log(nandGate(true, true));   // false`,
          },
          {
            type: 'text',
            text: 'NOR Gate - Detailed Analysis',
          },
          {
            type: 'table',
            table: {
              caption: 'NOR Gate Truth Table with Step-by-Step Analysis',
              headers: ['A', 'B', 'A OR B', 'NOR Output', 'Explanation'],
              rows: [
                ['0', '0', '0', '1', 'NOT(0) = 1'],
                ['0', '1', '1', '0', 'NOT(1) = 0'],
                ['1', '0', '1', '0', 'NOT(1) = 0'],
                ['1', '1', '1', '0', 'NOT(1) = 0'],
              ],
            },
          },
          {
            type: 'callout',
            callout: {
              type: 'tip',
              title: 'Manufacturing Advantage',
              content: 'Building chips with a single universal gate type simplifies manufacturing, reduces cost, and improves consistency in large-scale production.',
            },
          },
        ] as Prisma.JsonArray,
      },
      {
        id: 6,
        title: 'XOR, XNOR',
        contentText:
          'XOR (Exclusive OR) and XNOR (Exclusive NOR) gates are specialized gates that compare inputs for equality or difference, playing crucial roles in arithmetic circuits, error detection, and data encryption.',
        tags: ['logic-gates', 'exclusive', 'comparison'],
        displayContent: [
          {
            type: 'text',
            text: 'XOR and XNOR gates excel at detecting differences and similarities between inputs. They are essential in arithmetic logic units, parity checking, and cryptographic systems.',
          },
          {
            type: 'callout',
            callout: {
              type: 'info',
              title: 'Exclusive Operations',
              content:
                'XOR outputs true when inputs differ. XNOR outputs true when inputs match. Together they form the core of comparison logic in digital systems.',
            },
          },
          {
            type: 'table',
            table: {
              caption: 'Exclusive Gates Overview',
              headers: ['Gate', 'Full Name', 'Symbol', 'Operation', 'Key Characteristic'],
              rows: [
                ['XOR', 'Exclusive OR', '⊕', 'A ⊕ B', 'Output is 1 when inputs differ'],
                ['XNOR', 'Exclusive NOR', '⊙', '¬(A ⊕ B)', 'Output is 1 when inputs match'],
              ],
            },
          },
          {
            type: 'table',
            table: {
              caption: 'XOR Gate Truth Table',
              headers: ['A', 'B', 'XOR Output', 'Interpretation'],
              rows: [
                ['0', '0', '0', 'Inputs same → false'],
                ['0', '1', '1', 'Inputs differ → true'],
                ['1', '0', '1', 'Inputs differ → true'],
                ['1', '1', '0', 'Inputs same → false'],
              ],
            },
          },
          {
            type: 'codeBlock',
            language: 'javascript',
            code: `function xorGate(a, b) {
    return a !== b;
}

function xnorGate(a, b) {
    return a === b;
}`,
          },
          {
            type: 'list',
            list: [
              {
                text: '<strong>Error Detection</strong>',
                subItems: [
                  'Parity generation for communication systems',
                  'Detect single-bit transmission errors',
                ],
              },
              {
                text: '<strong>Cryptography</strong>',
                subItems: [
                  'XOR cipher for lightweight encryption',
                  'One-time pad implementations',
                ],
              },
              {
                text: '<strong>Arithmetic</strong>',
                subItems: [
                  'Binary addition (half adders and full adders)',
                  'Carry computation when combined with AND gates',
                ],
              },
            ],
          },
          {
            type: 'callout',
            callout: {
              type: 'tip',
              title: 'Design Insight',
              content:
                'XOR is self-inverse: applying the same XOR operation twice with the same key restores the original value. This property is the basis of many encryption and data masking techniques.',
            },
          },
        ] as Prisma.JsonArray,
      },
    ],
  },
  {
    id: 3,
    title: 'Truth Tables',
    topics: [
      {
        id: 7,
        title: 'Constructing Truth Tables',
        contentText:
          'Truth tables are systematic methods for documenting all possible input combinations and their corresponding outputs for Boolean expressions, providing a complete specification of logical behavior.',
        tags: ['truth-tables', 'methodology', 'systematic-approach'],
        displayContent: [
          {
            type: 'text',
            text: 'Truth tables provide a complete blueprint for Boolean expressions by enumerating every possible input combination and its resulting output.',
          },
          {
            type: 'callout',
            callout: {
              type: 'info',
              title: 'Why Truth Tables Matter',
              content: 'Truth tables ensure that complex logical systems behave predictably and help identify errors before circuits are built.',
            },
          },
          {
            type: 'list',
            list: [
              {
                text: '<strong>Step 1: Identify variables</strong>',
                subItems: [
                  'Count the distinct Boolean variables (A, B, C...)',
                  'Three variables require eight rows (2³)',
                ],
              },
              {
                text: '<strong>Step 2: Determine number of rows</strong>',
                subItems: ['Use 2^n rows for n variables', 'Fill inputs using binary counting patterns'],
              },
              {
                text: '<strong>Step 3: Evaluate expressions row-by-row</strong>',
                subItems: [
                  'Apply operator precedence (NOT > AND > OR)',
                  'Use helper columns for complex expressions',
                ],
              },
            ],
          },
          {
            type: 'table',
            table: {
              caption: 'Example: F = (A ∧ B) ∨ ¬C',
              headers: ['A', 'B', 'C', 'A ∧ B', '¬C', 'F'],
              rows: [
                ['0', '0', '0', '0', '1', '1'],
                ['0', '0', '1', '0', '0', '0'],
                ['0', '1', '0', '0', '1', '1'],
                ['0', '1', '1', '0', '0', '0'],
                ['1', '0', '0', '0', '1', '1'],
                ['1', '0', '1', '0', '0', '0'],
                ['1', '1', '0', '1', '1', '1'],
                ['1', '1', '1', '1', '0', '1'],
              ],
            },
          },
          {
            type: 'codeBlock',
            language: 'javascript',
            code: `function evaluateExpression(a, b, c) {
  const andResult = a && b;
  const notC = !c;
  return andResult || notC;
}`,
          },
          {
            type: 'callout',
            callout: {
              type: 'tip',
              title: 'Construction Checklist',
              content:
                'Always verify the number of rows, double-check binary counting order, and confirm intermediate column values before finalizing a truth table.',
            },
          },
        ] as Prisma.JsonArray,
      },
      {
        id: 8,
        title: 'Reading Truth Tables',
        contentText:
          'Reading and interpreting truth tables effectively allows you to understand Boolean functions, identify patterns, derive Boolean expressions from given outputs, and recognize standard logic gate behaviors.',
        tags: ['truth-tables', 'analysis', 'pattern-recognition'],
        displayContent: [
          {
            type: 'text',
            text: 'The ability to interpret truth tables lets you reverse-engineer Boolean expressions, debug logic, and map behaviors to known gate patterns.',
          },
          {
            type: 'callout',
            callout: {
              type: 'info',
              title: 'From Data to Understanding',
              content:
                'Truth tables contain all information about a Boolean system. Learn to read them effectively, and you can understand any combinational circuit.',
            },
          },
          {
            type: 'table',
            table: {
              caption: 'Pattern Recognition Examples',
              headers: ['Pattern', 'Interpretation'],
              rows: [
                ['Only one output = 1', 'Likely an AND combination of specific inputs'],
                ['Only one output = 0', 'Likely a NAND combination'],
                ['Alternating 0/1 pattern', 'Suggestive of XOR behavior'],
                ['Half 0s, half 1s', 'Output mirrors one of the input variables'],
              ],
            },
          },
          {
            type: 'codeBlock',
            language: 'javascript',
            code: `const mysteryGateTable = [
  { a: 0, b: 0, output: 1 },
  { a: 0, b: 1, output: 0 },
  { a: 1, b: 0, output: 0 },
  { a: 1, b: 1, output: 1 },
];

const looksLikeXNOR = mysteryGateTable.every(row => (row.a === row.b) === Boolean(row.output));`,
          },
          {
            type: 'callout',
            callout: {
              type: 'tip',
              title: 'SOP vs POS',
              content:
                'Sum-of-products (SOP) uses rows where the output is 1. Product-of-sums (POS) uses rows where the output is 0. Both lead to equivalent logic when simplified.',
            },
          },
        ] as Prisma.JsonArray,
      },
      {
        id: 9,
        title: 'Truth Tables for Gates',
        contentText:
          'A comprehensive reference showing truth tables for all standard logic gates, serving as a complete guide for understanding gate behaviors, relationships, and applications in digital circuit design.',
        tags: ['truth-tables', 'logic-gates', 'reference'],
        displayContent: [
          {
            type: 'text',
            text: 'This reference aggregates the truth tables for all primary gates, making it easy to compare behaviors and note relationships.',
          },
          {
            type: 'table',
            table: {
              caption: 'Two-Input Gate Reference',
              headers: ['A', 'B', 'AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR'],
              rows: [
                ['0', '0', '0', '0', '1', '1', '0', '1'],
                ['0', '1', '0', '1', '1', '0', '1', '0'],
                ['1', '0', '0', '1', '1', '0', '1', '0'],
                ['1', '1', '1', '1', '0', '0', '0', '1'],
              ],
            },
          },
          {
            type: 'list',
            list: [
              {
                text: '<strong>NOT gate (inverter)</strong>',
                subItems: ['Input 0 → Output 1', 'Input 1 → Output 0', 'Used for signal inversion'],
              },
              {
                text: '<strong>NAND</strong>',
                subItems: ['Equivalent to NOT(AND)', 'Universal gate for implementing any logic'],
              },
              {
                text: '<strong>NOR</strong>',
                subItems: ['Equivalent to NOT(OR)', 'Another universal gate'],
              },
            ],
          },
          {
            type: 'callout',
            callout: {
              type: 'important',
              title: 'Design Implication',
              content:
                'Recognizing relationships between gates allows designers to swap implementations for optimization. For example, replacing an AND + NOT pair with a single NAND saves transistors.',
            },
          },
        ] as Prisma.JsonArray,
      },
    ],
  },
  {
    id: 4,
    title: 'Simplification',
    topics: [
      {
        id: 10,
        title: 'Boolean Laws',
        contentText:
          'Boolean laws provide rules that help simplify expressions by reordering, grouping, or complementing terms while preserving logical equivalence.',
        tags: ['simplification', 'laws', 'identities'],
        displayContent: [
          {
            type: 'text',
            text: 'Boolean identities act like algebraic shortcuts. They let you reshape expressions without changing their meaning.',
          },
          {
            type: 'table',
            table: {
              caption: 'Core Boolean Laws',
              headers: ['Law', 'Expression', 'Interpretation'],
              rows: [
                ['Commutative', 'A + B = B + A', 'Order of OR does not matter'],
                ['Associative', '(A + B) + C = A + (B + C)', 'Grouping can change without effect'],
                ['Distributive', 'A(B + C) = AB + AC', 'Similar to numeric distribution'],
                ['Identity', 'A + 0 = A', 'Adding false changes nothing'],
                ['Null', 'A + 1 = 1', 'Adding true always yields true'],
                ['Idempotent', 'A + A = A', 'Repeating a variable has no effect'],
                ['Complement', 'A + A′ = 1', 'A variable or its complement covers all cases'],
                ['De Morgan', '(AB)′ = A′ + B′', 'AND complemented becomes OR of complements'],
              ],
            },
          },
          {
            type: 'callout',
            callout: {
              type: 'tip',
              title: 'Memorization Strategy',
              content: 'Group laws by purpose: reordering (commutative), regrouping (associative), distributing, and complementing (De Morgan).',
            },
          },
        ] as Prisma.JsonArray,
      },
      {
        id: 11,
        title: 'Karnaugh Maps',
        contentText:
          'Karnaugh maps (K-maps) provide a visual method for simplifying Boolean expressions by grouping adjacent cells that represent minterms differing by only one variable.',
        tags: ['simplification', 'karnaugh-maps', 'visual'],
        displayContent: [
          {
            type: 'text',
            text: 'Karnaugh maps translate truth tables into a visual grid layout that makes pattern recognition and simplification intuitive.',
          },
          {
            type: 'callout',
            callout: {
              type: 'info',
              title: 'Visual Simplification',
              content:
                'K-maps use Gray code ordering (00, 01, 11, 10) so adjacent cells differ by exactly one bit, making it easy to spot patterns and group terms for simplification.',
            },
          },
          {
            type: 'text',
            text: 'Basic K-map Construction:',
          },
          {
            type: 'table',
            table: {
              caption: '2-Variable K-map Layout',
              headers: ['', 'B=0', 'B=1'],
              rows: [
                ['A=0', 'Cell 0 (A′B′)', 'Cell 1 (A′B)'],
                ['A=1', 'Cell 2 (AB′)', 'Cell 3 (AB)'],
              ],
            },
          },
          {
            type: 'text',
            text: 'Grouping Rules for K-maps:',
          },
          {
            type: 'list',
            list: [
              {
                text: '<strong>Group Sizes</strong>: Must be powers of two (1, 2, 4, 8...)',
                subItems: [
                  'Octets (8 cells): Eliminate three variables',
                  'Quads (4 cells): Eliminate two variables',
                  'Pairs (2 cells): Eliminate one variable',
                  'Singles: Use only when no adjacent 1s exist',
                ],
              },
              {
                text: '<strong>Grouping Strategy</strong>',
                subItems: [
                  'Create the largest groups possible',
                  'Use the fewest number of groups',
                  'Groups can overlap if it reduces total groups',
                  'Groups can wrap around edges of the map',
                ],
              },
              {
                text: '<strong>Don\'t-Care Conditions (X)</strong>',
                subItems: [
                  'Represent input combinations that never occur or don\'t matter',
                  'Can be treated as 0 or 1, whichever helps create larger groups',
                  'Use them to simplify but don\'t include unnecessary ones',
                ],
              },
            ],
          },
          {
            type: 'text',
            text: 'Practical Example: Simplifying F = A B + A′ B + A C',
          },
          {
            type: 'list',
            list: [
              'Step 1: Plot the function on a K-map',
              'Step 2: Group adjacent 1s into largest possible groups',
              'Step 3: Write simplified expression: F = B + AC',
              'Result: Reduced from 3 AND gates + 1 OR gate to 1 AND gate + 1 OR gate',
            ],
          },
          {
            type: 'callout',
            callout: {
              type: 'important',
              title: 'Design Impact',
              content:
                'K-map simplification reduces gates, power consumption, and silicon area. Mastering this technique is essential for efficient digital circuit design.',
            },
          },
          {
            type: 'callout',
            callout: {
              type: 'tip',
              title: 'When to Use K-maps',
              content:
                'K-maps work best for functions with up to 4-5 variables. For more complex functions, algorithmic methods like Quine-McCluskey are more practical.',
            },
          },
        ] as Prisma.JsonArray,
      },
      {
        id: 12,
        title: 'Practical Examples',
        contentText:
          'Worked examples illustrate how to transform complex Boolean expressions into efficient forms ready for implementation using simplification techniques.',
        tags: ['simplification', 'examples', 'practice'],
        displayContent: [
          {
            type: 'text',
            text: 'Practical examples show how theoretical simplification techniques reduce circuit complexity in real designs.',
          },
          {
            type: 'text',
            text: 'Example 1: Simplify F = A B + A′ B + A C',
          },
          {
            type: 'list',
            list: [
              'Group terms: AB + A′B = B(A + A′) = B',
              'Expression becomes F = B + AC',
              'Result uses one OR and one AND gate (instead of three AND gates and one OR gate)',
              'Savings: 2 gates eliminated, reduced power consumption',
            ],
          },
          {
            type: 'divider',
          },
          {
            type: 'text',
            text: 'Example 2: Simplify F = A B C + A′ B C + A B′ C',
          },
          {
            type: 'list',
            list: [
              'Factor C: F = C(AB + A′B + AB′)',
              'Inside parentheses: AB + A′B = B(A + A′) = B',
              'Expression becomes F = C(B + AB′)',
              'Further simplify: B + AB′ = B + A (using absorption)',
              'Final result: F = C(B + A)',
            ],
          },
          {
            type: 'callout',
            callout: {
              type: 'important',
              title: 'Design Impact',
              content:
                'Each reduction saves gates, power, and silicon area. Simplification is key for high-performance, low-power digital design. In production, these savings multiply across millions of chips.',
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'text',
            text: 'Example 3: Using De Morgan\'s Laws',
          },
          {
            type: 'codeBlock',
            language: 'javascript',
            code: `// Original expression: F = ¬(A ∧ B) ∧ ¬(C ∨ D)
// Apply De Morgan's: ¬(A ∧ B) = ¬A ∨ ¬B
//                    ¬(C ∨ D) = ¬C ∧ ¬D
// Result: F = (¬A ∨ ¬B) ∧ (¬C ∧ ¬D)

function originalExpression(a, b, c, d) {
  return !(a && b) && !(c || d);
}

function simplifiedExpression(a, b, c, d) {
  return (!a || !b) && (!c && !d);
}`,
          },
          {
            type: 'callout',
            callout: {
              type: 'tip',
              title: 'Practice Makes Perfect',
              content:
                'The key to mastering simplification is practice. Start with simple expressions and gradually work up to more complex ones. Always verify your simplification using truth tables.',
            },
          },
        ] as Prisma.JsonArray,
      },
    ],
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data respecting foreign key constraints
  console.log('Clearing existing data...');
  const prismaAny = prisma as any;
  await prismaAny.userSkill.deleteMany({});
  await prismaAny.userTopic.deleteMany({});
  await prismaAny.userLesson.deleteMany({});
  await prismaAny.userLessonMastery.deleteMany({});
  await prisma.topic.deleteMany({});
  await prisma.lesson.deleteMany({});

  console.log('Creating lessons with topics...');

  for (const lesson of lessonsData) {
    await prisma.lesson.create({
      data: {
        id: lesson.id,
        title: lesson.title,
        topics: {
          create: lesson.topics.map((topic) => ({
            id: topic.id,
            title: topic.title,
            contentText: topic.contentText,
            tags: topic.tags,
            displayContent: topic.displayContent,
          })),
        },
      },
    });
  }

  console.log('✅ Seed completed successfully!');
  console.log(`Created ${lessonsData.length} lessons with ${lessonsData.reduce((count, lesson) => count + lesson.topics.length, 0)} topics total`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
