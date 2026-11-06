/* Matching Lab — the mastery quiz. */
(function (global) {
  'use strict';

  var QUESTIONS = [
    {
      id: 'q1',
      prompt: 'Why is the naive +16.9-day comparison wrong?',
      type: 'mcq',
      options: [
        'The drug actually causes harm.',
        'Sicker patients are more likely to get the drug, and severity also lengthens recovery.',
        'The sample is too small to say anything.'
      ],
      answer: 1,
      why: 'Severity is a confounder: it raises both the chance of treatment and the recovery time. The comparison mixes the drug effect with the reason it was prescribed.',
      link: '#problem',
      linkLabel: 'Section 00'
    },
    {
      id: 'q2',
      prompt: 'How does regression combine the two sex cells differently from subclassification?',
      type: 'mcq',
      options: [
        'It weights each cell by its sample size.',
        'It weights each cell by sample size times the variance of treatment in that cell.',
        'It gives every cell equal weight.'
      ],
      answer: 1,
      why: 'Regression weights cells by N_k × Var(T_k). Men have only one control, so their cell has less treatment variance and gets less weight; the estimate leans toward the women’s effect.',
      link: '#regression',
      linkLabel: 'Section 01'
    },
    {
      id: 'q3',
      prompt: 'The trainee comparison flips from −$4,297 to +$2,458 after matching on age. What does that show?',
      type: 'mcq',
      options: [
        'Training makes people richer by exactly $2,458.',
        'Trainees are younger; within the same age, trainees earn more on average.',
        'The controls were randomly selected.'
      ],
      answer: 1,
      why: 'The naive gap was mostly age. Exact matching removes age by comparing trainees with controls of the same age. The matched number is still an estimate, not a universal law.',
      link: '#exact',
      linkLabel: 'Section 03'
    },
    {
      id: 'q4',
      prompt: 'You match on raw age (18–70) and raw severity (0–1). Which feature dominates the Euclidean distance?',
      type: 'mcq',
      options: ['Severity', 'Age', 'Sex'],
      answer: 1,
      why: 'Age spans decades while severity spans one unit. Without standardization, a one-year age difference is tiny but a 0.1 severity difference is also tiny; the raw scale makes age dominate.',
      link: '#knn',
      linkLabel: 'Section 04'
    },
    {
      id: 'q5',
      prompt: 'In the bias correction, what is the regression on the untreated group estimating?',
      type: 'mcq',
      options: [
        'The treatment effect.',
        'The untreated outcome surface μ₀(x), used to price the match discrepancy.',
        'The propensity score.'
      ],
      answer: 1,
      why: 'It estimates E[Y | X, T=0] = μ₀(x). The correction subtracts μ̂₀(X_i) − μ̂₀(X_match); it does not extrapolate over treatment.',
      link: '#bias',
      linkLabel: 'Section 05'
    },
    {
      id: 'q6',
      prompt: 'With 10 covariates split into 3 bins each, how many cells are there?',
      type: 'number',
      answer: 59049,
      tolerance: 1,
      why: 'Each covariate triples the grid: 3^10 = 59,049 cells. Most would be empty with a realistic sample.',
      link: '#curse',
      linkLabel: 'Section 06'
    },
    {
      id: 'q7',
      prompt: 'Your matching estimate has a huge p90 match distance and the result is unstable. What is the best next step?',
      type: 'mcq',
      options: [
        'Increase k to 100 and report the average.',
        'Set a caliper, inspect common support, and report how many units are dropped.',
        'Drop the treated group and compare the controls.'
      ],
      answer: 1,
      why: 'Large distances mean the matches are not credible. A caliper restricts to the overlap, and reporting the dropped share makes the limitation visible. More neighbours can make the bias worse.',
      link: '#knn',
      linkLabel: 'Section 04'
    },
    {
      id: 'q8',
      prompt: 'The simulation truth is −10 days, but the bias-corrected estimate is −7.36. Why the gap?',
      type: 'mcq',
      options: [
        'Confounding is still present because sex was omitted.',
        'The matches are close but not exact, and the linear correction only approximates a nonlinear outcome surface.',
        'The sample is too small for any estimate.'
      ],
      answer: 1,
      why: 'All three confounders are in the match. The remaining gap is estimator bias: finite-sample matching discrepancy plus a linear correction for a nonlinear μ₀. An oracle model with the true functional form gets about −10.05.',
      link: '#knn',
      linkLabel: 'Section 04'
    }
  ];

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function render(container, saved) {
    container.innerHTML = '';
    QUESTIONS.forEach(function (q, index) {
      var field = document.createElement('fieldset');
      field.className = 'question';
      field.dataset.qid = q.id;

      var legend = document.createElement('legend');
      legend.className = 'q-title';
      legend.innerHTML = '<span class="q-num">' + String(index + 1).padStart(2, '0') + '</span>' + esc(q.prompt);
      field.appendChild(legend);

      if (q.type === 'mcq') {
        var opts = document.createElement('div');
        opts.className = 'options';
        q.options.forEach(function (opt, oi) {
          var label = document.createElement('label');
          label.className = 'option';
          label.dataset.value = String(oi);
          var input = document.createElement('input');
          input.type = 'radio';
          input.name = q.id;
          input.value = String(oi);
          if (saved && saved[q.id] != null && String(saved[q.id]) === String(oi)) {
            input.checked = true;
          }
          var span = document.createElement('span');
          span.textContent = opt;
          label.appendChild(input);
          label.appendChild(span);
          opts.appendChild(label);
        });
        field.appendChild(opts);
      } else {
        var wrap = document.createElement('div');
        wrap.className = 'options';
        var input = document.createElement('input');
        input.type = 'number';
        input.className = 'q-input';
        input.name = q.id;
        input.min = '0';
        input.step = '1';
        input.inputMode = 'numeric';
        input.setAttribute('aria-label', 'Numeric answer');
        if (saved && saved[q.id] != null && saved[q.id] !== '') input.value = saved[q.id];
        wrap.appendChild(input);
        field.appendChild(wrap);
      }

      var fb = document.createElement('div');
      fb.className = 'feedback';
      fb.id = 'fb-' + q.id;
      fb.setAttribute('aria-live', 'polite');
      field.appendChild(fb);

      container.appendChild(field);
    });
  }

  function readAnswers(form) {
    var out = {};
    QUESTIONS.forEach(function (q) {
      var field = form.querySelector('[data-qid="' + q.id + '"]');
      if (!field) return;
      if (q.type === 'mcq') {
        var checked = field.querySelector('input[type="radio"]:checked');
        out[q.id] = checked ? Number(checked.value) : null;
      } else {
        var input = field.querySelector('input[type="number"]');
        out[q.id] = input && input.value !== '' ? Number(input.value) : null;
      }
    });
    return out;
  }

  function evaluate(form, opts) {
    opts = opts || {};
    var answers = readAnswers(form);
    var score = 0;
    QUESTIONS.forEach(function (q) {
      var field = form.querySelector('[data-qid="' + q.id + '"]');
      var fb = field.querySelector('.feedback');
      var val = answers[q.id];
      var correct = false;
      if (q.type === 'mcq') {
        correct = val === q.answer;
      } else {
        correct = val != null && isFinite(val) && Math.abs(val - q.answer) <= (q.tolerance || 0);
      }
      if (correct) score++;

      if (q.type === 'mcq') {
        field.querySelectorAll('.option').forEach(function (label) {
          label.classList.remove('is-correct', 'is-wrong');
          var v = Number(label.dataset.value);
          if (v === q.answer) label.classList.add('is-correct');
          else if (v === val) label.classList.add('is-wrong');
        });
      }

      fb.innerHTML = '';
      fb.className = 'feedback is-visible ' + (correct ? 'is-correct' : 'is-wrong');
      var head = document.createElement('p');
      head.innerHTML = (correct ? '<strong>Correct.</strong> ' : '<strong>Not quite.</strong> ') + esc(q.why);
      fb.appendChild(head);
      var link = document.createElement('a');
      link.href = q.link;
      link.textContent = 'Review ' + q.linkLabel;
      fb.appendChild(link);

      if (opts.persist !== false) {
        global.MatchLabProgress.setQuiz({ answers: answers, score: score, submitted: true });
      }
    });
    return { answers: answers, score: score };
  }

  function init() {
    var form = global.document.getElementById('quiz-form');
    var scoreEl = global.document.getElementById('quiz-score');
    var resetBtn = global.document.getElementById('quiz-reset');
    if (!form || !scoreEl) return;

    var state = global.MatchLabProgress.state;
    var saved = state.quiz && state.quiz.answers ? state.quiz.answers : {};
    render(form, saved);
    if (state.quiz && state.quiz.submitted) {
      var result = evaluate(form, { persist: false });
      scoreEl.textContent = result.score + ' / ' + QUESTIONS.length;
    } else {
      scoreEl.textContent = '0 / ' + QUESTIONS.length;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var result = evaluate(form);
      scoreEl.textContent = result.score + ' / ' + QUESTIONS.length;
      if (global.MatchLabSound) global.MatchLabSound.stamp();
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        form.reset();
        form.querySelectorAll('.option').forEach(function (l) {
          l.classList.remove('is-correct', 'is-wrong');
        });
        form.querySelectorAll('.feedback').forEach(function (f) {
          f.className = 'feedback';
          f.innerHTML = '';
        });
        scoreEl.textContent = '0 / ' + QUESTIONS.length;
        global.MatchLabProgress.setQuiz({ answers: {}, score: 0, submitted: false });
      });
    }
  }

  global.MatchLabQuiz = { init: init, questions: QUESTIONS };
})(typeof window !== 'undefined' ? window : globalThis);
