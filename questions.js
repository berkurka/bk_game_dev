/* Keep Sharp question bank.
 *
 * Add a question by copying an object into QUESTIONS. The game logic in
 * app.js does not need to change. topic must be "algebra", "geometry",
 * or "calculus" (or a new id you also add to TOPICS in app.js).
 *
 * Fields:
 *   id             unique string
 *   topic          "algebra" | "geometry" | "calculus"
 *   difficulty     "easy" | "medium"
 *   prompt         sentence with \( inline \) or \[ display \] KaTeX
 *   answers        accepted responses. You do not need every variant:
 *                  spaces, capitalization, a leading "x=", equivalent
 *                  fractions and decimals, "9pi" / "9π", and factor
 *                  order are treated as the same. Do list forms that
 *                  are written differently, such as "8x+4" and "4(2x+1)".
 *                  Comma-separated answers stay in the order you list.
 *   displayAnswer  official answer, same KaTeX style as prompt
 *   hint           one starter tip that does not state the final answer
 *   formula        key formula in KaTeX, usually \[ display \]
 *   lesson         2–4 plain sentences. No HTML.
 *   learnUrl       stable topic page (Khan Academy, Paul's notes, Math is Fun)
 *   learnLabel     text for that link
 */
var QUESTIONS = [
  {
    id: "alg-linear",
    topic: "algebra",
    difficulty: "easy",
    prompt: "Solve for \\(x\\): \\(2x + 6 = 14\\).",
    answers: ["4", "x=4"],
    displayAnswer: "\\(x = 4\\)",
    hint: "Undo the addition first, then undo the multiplication.",
    formula: "\\[ax + b = c \\quad\\Rightarrow\\quad x = \\frac{c - b}{a}\\]",
    lesson: "A linear equation has the variable only to the first power. To solve it, undo whatever is done to the variable, working from the outside in, and do the same operation to both sides. Check by substituting your value back into the original equation.",
    learnUrl: "https://tutorial.math.lamar.edu/Classes/Alg/SolveLinearEqns.aspx",
    learnLabel: "Paul's Online Math Notes: Linear Equations"
  },
  {
    id: "alg-both-sides",
    topic: "algebra",
    difficulty: "medium",
    prompt: "Solve for \\(x\\): \\(5x - 3 = 2x + 9\\).",
    answers: ["4", "x=4"],
    displayAnswer: "\\(x = 4\\)",
    hint: "Collect the x terms on one side and the numbers on the other, then divide.",
    formula: "\\[ax + b = cx + d \\quad\\Rightarrow\\quad x = \\frac{d - b}{a - c}\\]",
    lesson: "When the variable appears on both sides, gather the variable terms on one side and the constants on the other. Add or subtract the same amount on both sides before you divide. The result is still one number that makes the two sides equal.",
    learnUrl: "https://tutorial.math.lamar.edu/Classes/Alg/SolveLinearEqns.aspx",
    learnLabel: "Paul's Online Math Notes: Linear Equations"
  },
  {
    id: "alg-slope",
    topic: "algebra",
    difficulty: "easy",
    prompt: "What is the slope of the line through \\((1, 2)\\) and \\((4, 8)\\)?",
    answers: ["2"],
    displayAnswer: "\\(2\\)",
    hint: "Divide the change in y by the change in x, and subtract the coordinates in the same order.",
    formula: "\\[m = \\frac{y_2 - y_1}{x_2 - x_1}\\]",
    lesson: "Slope measures how much y changes for each step in x, often called rise over run. Subtract the y-coordinates and divide by the difference of the x-coordinates, using the same point order in both subtractions. A positive slope climbs as x increases, and a negative slope falls.",
    learnUrl: "https://tutorial.math.lamar.edu/Classes/Alg/Lines.aspx",
    learnLabel: "Paul's Online Math Notes: Lines"
  },
  {
    id: "alg-line-value",
    topic: "algebra",
    difficulty: "easy",
    prompt: "A line has equation \\(y = 2x + 3\\). What is \\(y\\) when \\(x = 4\\)?",
    answers: ["11", "y=11"],
    displayAnswer: "\\(y = 11\\)",
    hint: "Substitute the given x. The equation is already solved for y.",
    formula: "\\[y = mx + b\\]",
    lesson: "Slope-intercept form names the slope as m and the y-intercept as b. To find y at a given x, substitute that x and simplify. The intercept is the y-value when x is zero, and it is already sitting in the equation.",
    learnUrl: "https://tutorial.math.lamar.edu/Classes/Alg/Lines.aspx",
    learnLabel: "Paul's Online Math Notes: Lines"
  },
  {
    id: "alg-factor",
    topic: "algebra",
    difficulty: "medium",
    prompt: "Factor \\(x^2 + 5x + 6\\). Write the factors as a product of binomials.",
    answers: ["(x+2)(x+3)"],
    displayAnswer: "\\((x + 2)(x + 3)\\)",
    hint: "Look for two binomials whose constants multiply to the last term and add to the middle coefficient.",
    formula: "\\[x^2 + (p + q)x + pq = (x + p)(x + q)\\]",
    lesson: "A quadratic factors into two binomials when you can find a pair of numbers that multiply to the constant term and add to the middle coefficient. Those two numbers become the constants in the binomials. Multiplying the binomials back out should recover the original quadratic.",
    learnUrl: "https://tutorial.math.lamar.edu/Classes/Alg/Factoring.aspx",
    learnLabel: "Paul's Online Math Notes: Factoring"
  },
  {
    id: "alg-roots",
    topic: "algebra",
    difficulty: "medium",
    prompt: "Solve \\(x^2 - 5x + 6 = 0\\). Enter both solutions separated by a comma.",
    answers: ["2,3", "3,2"],
    displayAnswer: "\\(x = 2\\) or \\(x = 3\\)",
    hint: "Factor the left side, then set each factor equal to zero. Separate the two solutions with a comma.",
    formula: "\\[x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\]",
    lesson: "If a product of factors is zero, then at least one factor is zero. Factor the quadratic, set each binomial equal to zero, and solve those simpler equations. The quadratic formula is the backup when factoring is not obvious, and both roots count as solutions.",
    learnUrl: "https://tutorial.math.lamar.edu/Classes/Alg/SolveQuadraticEqnsI.aspx",
    learnLabel: "Paul's Online Math Notes: Quadratic Equations"
  },
  {
    id: "alg-discriminant",
    topic: "algebra",
    difficulty: "medium",
    prompt: "For \\(x^2 - 4x - 5 = 0\\), what is the discriminant \\(b^2 - 4ac\\)?",
    answers: ["36"],
    displayAnswer: "\\(36\\)",
    hint: "Identify a, b, and c with their signs, then compute b squared minus 4ac. You do not need the roots.",
    formula: "\\[\\text{discriminant} = b^2 - 4ac\\]",
    lesson: "The quadratic formula uses a, b, and c from a quadratic set equal to zero. The discriminant is the expression under the square root, and its sign tells you how many real roots to expect. Keep the signs of b and c when you square and multiply.",
    learnUrl: "https://tutorial.math.lamar.edu/Classes/Alg/SolveQuadraticEqnsI.aspx",
    learnLabel: "Paul's Online Math Notes: Quadratic Equations"
  },
  {
    id: "alg-system",
    topic: "algebra",
    difficulty: "medium",
    prompt: "Solve the system \\(x + y = 10\\) and \\(x - y = 2\\). Enter \\(x\\) and \\(y\\) separated by a comma, with \\(x\\) first.",
    answers: ["6,4"],
    displayAnswer: "\\(x = 6\\), \\(y = 4\\)",
    hint: "Add the equations to eliminate one variable, then substitute to find the other.",
    formula: "\\[\\begin{aligned} x + y &= c \\\\ x - y &= d \\end{aligned}\\]",
    lesson: "A system asks for the pair of values that makes every equation true at the same time. Adding the equations can eliminate one variable when its coefficients are opposites. Once you know one variable, substitute it into either equation to find the other.",
    learnUrl: "https://tutorial.math.lamar.edu/Classes/Alg/SystemsTwoVrble.aspx",
    learnLabel: "Paul's Online Math Notes: Systems of Equations"
  },
  {
    id: "alg-exponents",
    topic: "algebra",
    difficulty: "easy",
    prompt: "Evaluate \\(2^3 \\cdot 2^4\\).",
    answers: ["128"],
    displayAnswer: "\\(128\\)",
    hint: "Add the exponents because the bases match, then evaluate that power.",
    formula: "\\[a^m \\cdot a^n = a^{m+n}\\]",
    lesson: "When you multiply powers with the same base, keep the base and add the exponents. You can then evaluate the single power by multiplying the base by itself that many times. Different bases do not combine this way until you rewrite them with a common base.",
    learnUrl: "https://www.mathsisfun.com/algebra/exponent-laws.html",
    learnLabel: "Math is Fun: Exponent Laws"
  },
  {
    id: "alg-log",
    topic: "algebra",
    difficulty: "medium",
    prompt: "Evaluate \\(\\log_2 32\\).",
    answers: ["5"],
    displayAnswer: "\\(5\\)",
    hint: "Rewrite the question as 2 raised to what power equals 32.",
    formula: "\\[\\log_b a = c \\quad\\Leftrightarrow\\quad b^c = a\\]",
    lesson: "A logarithm asks for an exponent. The log base 2 of a number is the power you raise 2 to in order to get that number. Listing powers of 2 is a reliable way to find small integer logs.",
    learnUrl: "https://tutorial.math.lamar.edu/Classes/Alg/LogFunctions.aspx",
    learnLabel: "Paul's Online Math Notes: Logarithm Functions"
  },
  {
    id: "geo-pythag",
    topic: "geometry",
    difficulty: "easy",
    prompt: "A right triangle has legs of length \\(3\\) and \\(4\\). How long is the hypotenuse?",
    answers: ["5"],
    displayAnswer: "\\(5\\)",
    hint: "Square each leg, add the squares, and take the square root.",
    formula: "\\[a^2 + b^2 = c^2\\]",
    lesson: "The Pythagorean theorem applies to right triangles only. The two legs are the sides that meet at the right angle, and the hypotenuse is the side opposite that angle. Square the legs, add those squares, and the hypotenuse is the square root of the sum.",
    learnUrl: "https://www.mathsisfun.com/pythagoras.html",
    learnLabel: "Math is Fun: Pythagoras' Theorem"
  },
  {
    id: "geo-leg",
    topic: "geometry",
    difficulty: "medium",
    prompt: "A right triangle has hypotenuse \\(13\\) and one leg \\(5\\). How long is the other leg?",
    answers: ["12"],
    displayAnswer: "\\(12\\)",
    hint: "Subtract the known leg's square from the hypotenuse's square, then take the square root.",
    formula: "\\[b = \\sqrt{c^2 - a^2}\\]",
    lesson: "The Pythagorean theorem still applies when the hypotenuse is the known side. Square the hypotenuse and subtract the square of the known leg. The other leg is the square root of what remains, and a length is positive.",
    learnUrl: "https://www.mathsisfun.com/pythagoras.html",
    learnLabel: "Math is Fun: Pythagoras' Theorem"
  },
  {
    id: "geo-rectangle",
    topic: "geometry",
    difficulty: "easy",
    prompt: "A rectangle is \\(7\\) units long and \\(5\\) units wide. What is its area?",
    answers: ["35"],
    displayAnswer: "\\(35\\)",
    hint: "Multiply the two side lengths.",
    formula: "\\[A = \\ell w\\]",
    lesson: "The area of a rectangle is the product of its length and width. Units of area are squared, such as square centimeters, even when a problem only asks for the number. If the sides are perpendicular, you do not need a diagonal or an angle.",
    learnUrl: "https://www.mathsisfun.com/geometry/rectangle.html",
    learnLabel: "Math is Fun: Rectangles"
  },
  {
    id: "geo-triangle-area",
    topic: "geometry",
    difficulty: "easy",
    prompt: "A triangle has base \\(10\\) and height \\(6\\). What is its area?",
    answers: ["30"],
    displayAnswer: "\\(30\\)",
    hint: "Take half of base times height. Use the perpendicular height.",
    formula: "\\[A = \\frac{1}{2}bh\\]",
    lesson: "The area of a triangle is half the product of a base and the height perpendicular to that base. The height has to meet the base at a right angle, even if that meeting point is outside the triangle. Skipping the one-half gives the area of a parallelogram instead.",
    learnUrl: "https://www.mathsisfun.com/area.html",
    learnLabel: "Math is Fun: Area"
  },
  {
    id: "geo-circle-area",
    topic: "geometry",
    difficulty: "medium",
    prompt: "A circle has radius 3. What is its area? Leave \\(\\pi\\) in the answer (type pi).",
    answers: ["9pi"],
    displayAnswer: "\\(9\\pi\\)",
    hint: "Start from π times the radius squared, and leave π written as pi.",
    formula: "\\[A = \\pi r^2\\]",
    lesson: "The area of a circle is π times the radius squared. Square the radius first, then multiply by π, rather than squaring the whole product. Unless a problem asks for a decimal, leave π in the answer so the value stays exact.",
    learnUrl: "https://www.mathsisfun.com/geometry/circle-area.html",
    learnLabel: "Math is Fun: Area of a Circle"
  },
  {
    id: "geo-circumference",
    topic: "geometry",
    difficulty: "medium",
    prompt: "A circle has radius 5. What is its circumference? Leave \\(\\pi\\) in the answer (type pi).",
    answers: ["10pi"],
    displayAnswer: "\\(10\\pi\\)",
    hint: "The radius goes into the circumference formula. Leave π written as pi.",
    formula: "\\[C = 2\\pi r\\]",
    lesson: "The circumference is the distance around a circle, equal to 2π times the radius, or π times the diameter. The radius is half the diameter, so check which one the problem gives you. Leaving π in the answer keeps the measurement exact.",
    learnUrl: "https://www.mathsisfun.com/geometry/circle.html",
    learnLabel: "Math is Fun: Circles"
  },
  {
    id: "geo-prism",
    topic: "geometry",
    difficulty: "easy",
    prompt: "A rectangular prism measures \\(2\\) by \\(3\\) by \\(4\\). What is its volume?",
    answers: ["24"],
    displayAnswer: "\\(24\\)",
    hint: "Multiply the three edge lengths that meet at a corner.",
    formula: "\\[V = \\ell w h\\]",
    lesson: "The volume of a rectangular prism is length times width times height. Any edge can be called the height as long as you use the three dimensions that meet at a corner. Volume is measured in cubic units.",
    learnUrl: "https://www.mathsisfun.com/geometry/cuboids-rectangular-prisms.html",
    learnLabel: "Math is Fun: Rectangular Prisms"
  },
  {
    id: "geo-cylinder",
    topic: "geometry",
    difficulty: "medium",
    prompt: "A cylinder has radius 2 and height 5. What is its volume? Leave \\(\\pi\\) in the answer (type pi).",
    answers: ["20pi"],
    displayAnswer: "\\(20\\pi\\)",
    hint: "Find the area of the circular base, multiply by the height, and keep π.",
    formula: "\\[V = \\pi r^2 h\\]",
    lesson: "A cylinder's volume is the area of its circular base times its height. The base area is π times the radius squared, so the volume multiplies that area by the height. Keep π in an exact answer, and do not confuse this with the surface area, which also counts the side wall.",
    learnUrl: "https://www.mathsisfun.com/geometry/cylinder.html",
    learnLabel: "Math is Fun: Cylinders"
  },
  {
    id: "geo-similar",
    topic: "geometry",
    difficulty: "medium",
    prompt: "A triangle with sides \\(3\\), \\(4\\), and \\(5\\) is enlarged by a scale factor of \\(2\\). What is the longest side of the new triangle?",
    answers: ["10"],
    displayAnswer: "\\(10\\)",
    hint: "The longest side of the new triangle corresponds to the longest side of the original. Scale that length.",
    formula: "\\[\\frac{a_1}{a_2} = \\frac{b_1}{b_2} = \\frac{c_1}{c_2}\\]",
    lesson: "Similar triangles have the same angles, and their matching sides are proportional. One scale factor applies to every pair of corresponding sides, including the longest sides. Identify which sides match before you multiply.",
    learnUrl: "https://www.mathsisfun.com/geometry/triangles-similar.html",
    learnLabel: "Math is Fun: Similar Triangles"
  },
  {
    id: "geo-sine",
    topic: "geometry",
    difficulty: "medium",
    prompt: "In a right triangle, the side opposite an acute angle is \\(3\\) and the hypotenuse is \\(5\\). What is the sine of that angle?",
    answers: ["3/5", "0.6"],
    displayAnswer: "\\(\\dfrac{3}{5}\\)",
    hint: "Divide the opposite side by the hypotenuse. A fraction in lowest terms is ideal.",
    formula: "\\[\\sin \\theta = \\frac{\\text{opposite}}{\\text{hypotenuse}}\\]",
    lesson: "In a right triangle, sine of an acute angle is the length of the opposite side divided by the hypotenuse. Cosine uses the adjacent side over the hypotenuse, and tangent uses opposite over adjacent. A simplified fraction is an exact answer, and the decimal form of that same fraction is the same value.",
    learnUrl: "https://www.mathsisfun.com/sine-cosine-tangent.html",
    learnLabel: "Math is Fun: Sine, Cosine and Tangent"
  },
  {
    id: "calc-power-cubic",
    topic: "calculus",
    difficulty: "easy",
    prompt: "Find the derivative of \\(x^3\\). Write powers with ^, as in \\(nx^k\\).",
    answers: ["3x^2"],
    displayAnswer: "\\(3x^2\\)",
    hint: "Bring the exponent down in front, then reduce the power by one.",
    formula: "\\[\\frac{d}{dx} x^n = n x^{n-1}\\]",
    lesson: "The power rule says the derivative of x to the n is n times x to the n minus 1. The exponent comes down as a coefficient, and the power left behind is one smaller. A constant in front of a power is multiplied by that new coefficient.",
    learnUrl: "https://www.mathsisfun.com/calculus/derivatives-rules.html",
    learnLabel: "Math is Fun: Derivative Rules"
  },
  {
    id: "calc-power-fourth",
    topic: "calculus",
    difficulty: "easy",
    prompt: "Find the derivative of \\(5x^4\\). Write powers with ^.",
    answers: ["20x^3"],
    displayAnswer: "\\(20x^3\\)",
    hint: "Multiply the coefficient by the exponent, then reduce the exponent by one.",
    formula: "\\[\\frac{d}{dx} (c x^n) = c n x^{n-1}\\]",
    lesson: "Coefficients stay in the product when you use the power rule. Multiply the original coefficient by the old exponent, then reduce the exponent by one. The derivative of a plain constant term is zero, which is why constants disappear.",
    learnUrl: "https://www.mathsisfun.com/calculus/derivatives-rules.html",
    learnLabel: "Math is Fun: Derivative Rules"
  },
  {
    id: "calc-polynomial",
    topic: "calculus",
    difficulty: "medium",
    prompt: "Find the derivative of \\(4x^2 - 3x + 7\\).",
    answers: ["8x-3"],
    displayAnswer: "\\(8x - 3\\)",
    hint: "Differentiate each term separately. Drop the constant term.",
    formula: "\\[\\frac{d}{dx}(ax^2 + bx + c) = 2ax + b\\]",
    lesson: "Differentiate a polynomial one term at a time and add the results. Each power uses the power rule, and the derivative of a constant is zero. The answer is usually a simpler polynomial, one degree lower than the original.",
    learnUrl: "https://www.mathsisfun.com/calculus/derivatives-rules.html",
    learnLabel: "Math is Fun: Derivative Rules"
  },
  {
    id: "calc-product",
    topic: "calculus",
    difficulty: "medium",
    prompt: "Find the derivative of \\(x(x^2 + 1)\\). Simplify your answer.",
    answers: ["3x^2+1"],
    displayAnswer: "\\(3x^2 + 1\\)",
    hint: "Derivative of the first times the second, plus the first times the derivative of the second. Then combine like terms.",
    formula: "\\[(fg)' = f'g + fg'\\]",
    lesson: "The product rule is for a product of functions, not a single power. Differentiate the first factor and multiply by the untouched second factor, then add the first factor times the derivative of the second. Simplify by combining like terms after you expand.",
    learnUrl: "https://tutorial.math.lamar.edu/Classes/CalcI/ProductQuotientRule.aspx",
    learnLabel: "Paul's Online Math Notes: Product and Quotient Rule"
  },
  {
    id: "calc-chain",
    topic: "calculus",
    difficulty: "medium",
    prompt: "Find the derivative of \\((2x + 1)^2\\). An expanded answer is fine.",
    answers: ["8x+4", "4(2x+1)"],
    displayAnswer: "\\(8x + 4\\)",
    hint: "Differentiate the outer power, keep the inside, and multiply by the derivative of the inside.",
    formula: "\\[\\frac{d}{dx} f(g(x)) = f'(g(x)) \\, g'(x)\\]",
    lesson: "The chain rule handles a function inside another function. Differentiate the outside and leave the inside as it is, then multiply by the derivative of the inside. For a power of a binomial, the outside derivative brings down the exponent and the inside contributes its own derivative.",
    learnUrl: "https://tutorial.math.lamar.edu/Classes/CalcI/ChainRule.aspx",
    learnLabel: "Paul's Online Math Notes: Chain Rule"
  },
  {
    id: "calc-integral-linear",
    topic: "calculus",
    difficulty: "easy",
    prompt: "Evaluate the definite integral.\n\\[\\int_0^3 2x \\, dx\\]",
    answers: ["9"],
    displayAnswer: "\\(9\\)",
    hint: "Find an antiderivative, then subtract its value at the lower limit from its value at the upper limit.",
    formula: "\\[\\int_a^b f(x) \\, dx = F(b) - F(a)\\]",
    lesson: "A definite integral equals the antiderivative at the right endpoint minus the antiderivative at the left endpoint. Find any antiderivative first, then evaluate it at the two limits. The constant of integration cancels in that subtraction, so you can take it to be zero.",
    learnUrl: "https://tutorial.math.lamar.edu/Classes/CalcI/ComputingDefiniteIntegrals.aspx",
    learnLabel: "Paul's Online Math Notes: Computing Definite Integrals"
  },
  {
    id: "calc-integral-square",
    topic: "calculus",
    difficulty: "medium",
    prompt: "Evaluate the definite integral. A fraction is ideal.\n\\[\\int_0^2 x^2 \\, dx\\]",
    answers: ["8/3"],
    displayAnswer: "\\(\\dfrac{8}{3}\\)",
    hint: "Raise the power by one and divide by the new power, then evaluate between the limits.",
    formula: "\\[\\int x^n \\, dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)\\]",
    lesson: "The power rule for integrals raises the exponent by one and divides by the new exponent. Evaluate that antiderivative at the upper limit and subtract the value at the lower limit. An exact fraction is preferable to a rounded decimal.",
    learnUrl: "https://tutorial.math.lamar.edu/Classes/CalcI/ComputingDefiniteIntegrals.aspx",
    learnLabel: "Paul's Online Math Notes: Computing Definite Integrals"
  },
  {
    id: "calc-integral-bounds",
    topic: "calculus",
    difficulty: "medium",
    prompt: "Evaluate the definite integral.\n\\[\\int_1^2 3x^2 \\, dx\\]",
    answers: ["7"],
    displayAnswer: "\\(7\\)",
    hint: "The lower limit is not zero, so evaluate the antiderivative at both ends and subtract.",
    formula: "\\[\\int_a^b f(x) \\, dx = F(b) - F(a)\\]",
    lesson: "When the lower limit is not zero, the antiderivative at that limit is not automatically zero. Compute the antiderivative at both ends and subtract in the order upper minus lower. A coefficient in front of a power is included when you find the antiderivative.",
    learnUrl: "https://tutorial.math.lamar.edu/Classes/CalcI/ComputingDefiniteIntegrals.aspx",
    learnLabel: "Paul's Online Math Notes: Computing Definite Integrals"
  },
  {
    id: "calc-limit",
    topic: "calculus",
    difficulty: "medium",
    prompt: "Evaluate the limit.\n\\[\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}\\]",
    answers: ["4"],
    displayAnswer: "\\(4\\)",
    hint: "Direct substitution makes the denominator zero. Factor the numerator and cancel before you substitute.",
    formula: "\\[\\lim_{x \\to a} f(x) = L\\]",
    lesson: "A limit asks for the value the expression approaches, which may exist even when direct substitution gives zero divided by zero. Factor and cancel the common factor that made the denominator zero, then substitute. After canceling, the simplified function agrees with the original everywhere except at that one point.",
    learnUrl: "https://tutorial.math.lamar.edu/Classes/CalcI/LimitsIntro.aspx",
    learnLabel: "Paul's Online Math Notes: Limits"
  },
  {
    id: "calc-tangent-slope",
    topic: "calculus",
    difficulty: "easy",
    prompt: "What is the slope of the tangent line to \\(f(x) = x^2\\) at \\(x = 3\\)?",
    answers: ["6"],
    displayAnswer: "\\(6\\)",
    hint: "Differentiate to get a formula for the slope, then substitute the given x-value.",
    formula: "\\[f'(a) = \\lim_{h \\to 0} \\frac{f(a + h) - f(a)}{h}\\]",
    lesson: "The derivative of a function at a point is the slope of the tangent line there. Differentiate the function first so you have a slope formula, then substitute the x-value of the point. The y-value of the point is not required when the question only asks for the slope.",
    learnUrl: "https://tutorial.math.lamar.edu/Classes/CalcI/Tangents_Rates.aspx",
    learnLabel: "Paul's Online Math Notes: Tangents and Rates of Change"
  }
];
