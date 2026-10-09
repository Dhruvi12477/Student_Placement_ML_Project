/* =========================================================
   FIRSTSTEP AI
   AI JOB READINESS ASSESSMENT
   ========================================================= */

const state = {
  selectedSkills: new Set()
};


/* =========================================================
   DOM HELPER
   ========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   NUMBER HELPER
   ========================================================= */

function getNumber(id, defaultValue = 0) {

  const element = $(id);

  if (!element) {
    return defaultValue;
  }

  const value = Number(element.value);

  return Number.isFinite(value)
    ? value
    : defaultValue;
}


/* =========================================================
   API
   ========================================================= */

async function getJSON(url, options = {}) {

  const response = await fetch(url, options);

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {

    throw new Error(
      data.error ||
      data.errors?.join(", ") ||
      "Something went wrong."
    );

  }

  return data;

}


/* =========================================================
   SELECT CONFIG
   ========================================================= */

function fillSelect(id, values) {

  const select = $(id);

  if (!select) return;

  const currentValue = select.value;

  select.innerHTML = "";

  const placeholder = document.createElement("option");

  placeholder.value = "";
  placeholder.textContent =
    id === "gender"
      ? "Select gender"
      : "Select education level";

  select.appendChild(placeholder);

  values.forEach(value => {

    const option =
      document.createElement("option");

    option.value = value;
    option.textContent = value;

    select.appendChild(option);

  });

  if (
    values.includes(currentValue)
  ) {

    select.value = currentValue;

  }

}


/* =========================================================
   LOAD CONFIG
   ========================================================= */

async function loadConfig() {

  try {

    const config =
      await getJSON("/api/config");

    fillSelect(
      "gender",
      config.genders || []
    );

    fillSelect(
      "degree",
      config.degrees || []
    );

  } catch (error) {

    console.error(
      "Config error:",
      error
    );

    showError(
      error.message
    );

  }

}


/* =========================================================
   ERROR HANDLING
   ========================================================= */

function showError(message) {

  const box = $("errorBox");

  if (!box) {

    console.error(message);

    return;

  }

  box.hidden = false;

  box.innerHTML = `
    <ul>
      <li>${escapeHtml(message)}</li>
    </ul>
  `;

  box.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

}


function clearError() {

  const box = $("errorBox");

  if (!box) return;

  box.hidden = true;
  box.innerHTML = "";

}


function escapeHtml(value) {

  return String(value).replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char])
  );

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function goToSection(index) {

  const section =
    $(`section-${index}`);

  if (!section) return;

  document
    .querySelectorAll(".form-section")
    .forEach(sectionItem => {

      sectionItem.classList.remove(
        "current"
      );

    });

  section.classList.add("current");

  section.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  document
    .querySelectorAll(".rail-step")
    .forEach((step, i) => {

      step.classList.toggle(
        "active",
        i === index - 1
      );

    });

}


/* =========================================================
   COMMUNICATION
   ========================================================= */

function setupCommunication() {

  document
    .querySelectorAll(
      'input[name="communication_level"]'
    )
    .forEach(radio => {

      radio.addEventListener(
        "change",
        () => {

          const hiddenField =
            $("communication_skills");

          if (hiddenField) {

            hiddenField.value =
              radio.value;

          }

          clearError();

        }
      );

    });

}


/* =========================================================
   COMMUNICATION ELIGIBILITY
   ========================================================= */

function isCommunicationEligible() {

  const selected =
    document.querySelector(
      'input[name="communication_level"]:checked'
    );

  const selectedValue =
    selected?.value ||
    $("communication_skills")?.value ||
    "";

  const numericValue =
    Number(selectedValue);

  /*
   * HTML values:
   *
   * Beginner        = 1
   * Intermediate    = 4
   * Pretty Good     = 6
   * Full Confidence = 8
   * English Pro Max = 10
   *
   * Pretty Good and above are eligible.
   */

  if (
    Number.isFinite(numericValue) &&
    numericValue >= 6
  ) {

    return true;

  }

  const textValue =
    String(selectedValue)
      .toLowerCase()
      .trim();

  const acceptedLevels = [
    "pretty good",
    "full confidence",
    "english pro max",
    "pretty good!",
    "full confidence 🗣️",
    "english pro max 🚀"
  ];

  return acceptedLevels.includes(
    textValue
  );

}


/* =========================================================
   DAILY STUDY HOURS
   ========================================================= */

function getDailyStudyHours() {

  /*
   * Your current HTML uses:
   *
   * id="daily_hours"
   *
   * These alternatives are also supported.
   */

  const possibleIds = [
    "daily_hours",
    "daily_study",
    "daily_study_hours",
    "daily_study_hrs",
    "study_hours"
  ];

  for (const id of possibleIds) {

    const element = $(id);

    if (
      element &&
      String(element.value).trim() !== ""
    ) {

      const value =
        Number(element.value);

      if (Number.isFinite(value)) {

        return value;

      }

    }

  }

  return 0;

}


/* =========================================================
   VALIDATION
   ========================================================= */

function validateStep(index) {

  clearError();

  const section =
    $(`section-${index}`);

  if (!section) {

    return true;

  }


  /* -------------------------------------------------------
     REQUIRED FIELDS
     ------------------------------------------------------- */

  const required =
    [
      ...section.querySelectorAll(
        "[required]"
      )
    ];


  for (const input of required) {

    if (
      !String(input.value).trim()
    ) {

      input.focus();

      const label =
        input
          .closest(
            ".field, .metric-field, .tech-input-group"
          )
          ?.querySelector(
            "span, label"
          )
          ?.textContent
          ?.replace("optional", "")
          ?.trim()
        ||
        input.name ||
        "this field";

      showError(
        `Please complete "${label}".`
      );

      return false;

    }

  }


  /* -------------------------------------------------------
     SECTION 1 - AGE
     ------------------------------------------------------- */

  if (index === 1) {

    const age =
      getNumber("age");

    if (
      age < 15 ||
      age > 35
    ) {

      return invalid(
        "Age must be between 15 and 35."
      );

    }

  }


  /* -------------------------------------------------------
     SECTION 2 - EXPERIENCE
     ------------------------------------------------------- */

  if (index === 2) {

    const internships =
      getNumber("internships");

    const projects =
      getNumber("projects");

    const certifications =
      getNumber("certifications");

    const dailyStudy =
      getDailyStudyHours();


    if (internships < 0) {

      $("internships")?.focus();

      return invalid(
        "Internships cannot be negative."
      );

    }


    if (projects < 0) {

      $("projects")?.focus();

      return invalid(
        "Projects cannot be negative."
      );

    }


    if (certifications < 0) {

      $("certifications")?.focus();

      return invalid(
        "Certifications cannot be negative."
      );

    }


    if (dailyStudy < 0) {

      $("daily_hours")?.focus();

      return invalid(
        "Daily study hours cannot be negative."
      );

    }

  }


  /* -------------------------------------------------------
     SECTION 3 - COMMUNICATION
     ------------------------------------------------------- */

  if (index === 3) {

    const selectedCommunication =
      document.querySelector(
        'input[name="communication_level"]:checked'
      );

    const communicationValue =
      $("communication_skills")?.value || "";


    if (
      !selectedCommunication &&
      !String(
        communicationValue
      ).trim()
    ) {

      return invalid(
        "Please select your English communication level."
      );

    }

  }


  /* -------------------------------------------------------
     SECTION 4 - ADDITIONAL TECH
     ------------------------------------------------------- */

  if (index === 4) {

    const aiAgents =
      getNumber("ai_agents");

    const additionalProjects =
      getNumber("additional_projects");

    const aiTools =
      getNumber("ai_tools");


    if (aiAgents < 0) {

      $("ai_agents")?.focus();

      return invalid(
        "AI Agents cannot be negative."
      );

    }


    if (additionalProjects < 0) {

      $("additional_projects")?.focus();

      return invalid(
        "AI / Automation projects cannot be negative."
      );

    }


    if (aiTools < 0) {

      $("ai_tools")?.focus();

      return invalid(
        "AI Tools cannot be negative."
      );

    }

  }


  return true;

}


/* =========================================================
   INVALID
   ========================================================= */

function invalid(message) {

  showError(message);

  return false;

}


/* =========================================================
   SKILLS
   ========================================================= */

function collectSkills() {

  const technicalSkills =
    [
      ...state.selectedSkills
    ];


  if ($("technical_skills")) {

    $("technical_skills").value =
      technicalSkills.join(", ");

  }


  if ($("skillCount")) {

    /*
     * Display selected technical skills.
     */

    $("skillCount").textContent =
      technicalSkills.length;

  }

}


/* =========================================================
   SKILL PILLS
   ========================================================= */

function setupSkillPills() {

  document
    .querySelectorAll(".skill-pill")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const skill =
            button.dataset.skill;

          if (!skill) return;


          if (
            state.selectedSkills.has(skill)
          ) {

            state.selectedSkills.delete(
              skill
            );

            button.classList.remove(
              "selected"
            );

          } else {

            state.selectedSkills.add(
              skill
            );

            button.classList.add(
              "selected"
            );

          }

          collectSkills();

        }
      );

    });

}


/* =========================================================
   PYTHON LEVEL
   ========================================================= */

function getPythonLevel() {

  return (
    document.querySelector(
      'input[name="python_level"]:checked'
    )?.value || ""
  );

}


function pythonLevelScore() {

  const value =
    getPythonLevel();


  return ({
    Beginner: 3,
    Intermediate: 6,
    Advanced: 8,
    Pro: 10
  }[value] || 0);

}


/* =========================================================
   NORMALIZED SKILLS
   ========================================================= */

function normalizedSkills() {

  return [
    ...state.selectedSkills
  ]
    .map(skill =>
      String(skill)
        .toLowerCase()
        .trim()
    );

}


/* =========================================================
   HAS SKILL
   ========================================================= */

function hasSkill(...names) {

  const skills =
    normalizedSkills();


  return names.some(name =>
    skills.includes(
      String(name)
        .toLowerCase()
        .trim()
    )
  );

}


/* =========================================================
   ADDITIONAL TECH COUNT
   ========================================================= */

function updateAdditionalTechCount() {

  const aiAgents =
    getNumber("ai_agents");

  const projects =
    getNumber("additional_projects");

  const aiTools =
    getNumber("ai_tools");


  const values = [
    aiAgents,
    projects,
    aiTools
  ];


  const filledCount =
    values.filter(
      value =>
        Number.isFinite(value) &&
        value > 0
    ).length;


  if ($("skillCount")) {

    $("skillCount").textContent =
      filledCount;

  }

}


/* =========================================================
   ADDITIONAL TECH SETUP
   ========================================================= */

function setupAdditionalTech() {

  const fields = [
    $("ai_agents"),
    $("additional_projects"),
    $("ai_tools")
  ];


  fields.forEach(input => {

    if (!input) return;


    input.addEventListener(
      "input",
      updateAdditionalTechCount
    );


    input.addEventListener(
      "change",
      updateAdditionalTechCount
    );

  });


  updateAdditionalTechCount();

}


/* =========================================================
   ADDITIONAL TECH SCORE
   ========================================================= */

function calculateAdditionalTechScore() {

  const aiAgents =
    getNumber("ai_agents");

  const projects =
    getNumber("additional_projects");

  const aiTools =
    getNumber("ai_tools");


  const agentScore =
    Math.min(
      aiAgents / 50,
      1
    ) * 10;


  const projectScore =
    Math.min(
      projects / 5,
      1
    ) * 10;


  const toolScore =
    Math.min(
      aiTools / 50,
      1
    ) * 10;


  return {

    aiAgents,

    projects,

    aiTools,

    agentScore,

    projectScore,

    toolScore,

    total:
      agentScore +
      projectScore +
      toolScore

  };

}


/* =========================================================
   JOB READINESS ELIGIBILITY
   ========================================================= */

function checkJobReadinessEligibility() {

  /* -------------------------------------------------------
     BASIC VALUES
     ------------------------------------------------------- */

  const totalProjects =
    getNumber("projects");

  const aiAutomationProjects =
    getNumber("additional_projects");

  const certifications =
    getNumber("certifications");

  const internships =
    getNumber("internships");

  const dailyStudy =
    getDailyStudyHours();

  const aiAgents =
    getNumber("ai_agents");

  const aiTools =
    getNumber("ai_tools");


  /* -------------------------------------------------------
     COMMUNICATION
     ------------------------------------------------------- */

  const communicationOK =
    isCommunicationEligible();


  /* -------------------------------------------------------
     PYTHON
     ------------------------------------------------------- */

  const pythonSkillOK =
    hasSkill("Python");


  const pythonLevel =
    getPythonLevel();


  const pythonLevelOK =
    [
      "Advanced",
      "Pro"
    ].includes(
      pythonLevel
    );


  /* -------------------------------------------------------
     WEB
     ------------------------------------------------------- */

  const htmlOK =
    hasSkill("HTML");

  const cssOK =
    hasSkill("CSS");

  const javascriptOK =
    hasSkill("JavaScript");


  /* -------------------------------------------------------
     FUNDAMENTALS
     ------------------------------------------------------- */

  const logicOK =
    hasSkill(
      "Logic Building",
      "Logic"
    );


  const oopsOK =
    hasSkill(
      "OOPs",
      "OOP"
    );


  const dsaOK =
    hasSkill("DSA");


  /* -------------------------------------------------------
     AI
     ------------------------------------------------------- */

  const llmsOK =
    hasSkill(
      "LLMs",
      "LLM"
    );


  const promptEngineeringOK =
    hasSkill(
      "Prompt Engineering"
    );


  const langchainOK =
    hasSkill(
      "LangChain"
    );


  const n8nOK =
    hasSkill(
      "n8n"
    );


  const makeZapierOK =
    hasSkill(
      "Make/Zapier",
      "Make",
      "Zapier"
    );


  /* -------------------------------------------------------
     MANDATORY REQUIREMENTS
     ------------------------------------------------------- */

  const requirements = {

    /*
     * Experience
     */

    projects:
      totalProjects >= 15,

    certifications:
      certifications >= 10,

    dailyStudy:
      dailyStudy >= 4,


    /*
     * Communication
     */

    communication:
      communicationOK,


    /*
     * Web + Programming
     */

    html:
      htmlOK,

    css:
      cssOK,

    javascript:
      javascriptOK,

    python:
      pythonSkillOK,

    pythonLevel:
      pythonLevelOK,


    /*
     * Fundamentals
     */

    logicBuilding:
      logicOK,

    oops:
      oopsOK,

    dsa:
      dsaOK,


    /*
     * AI
     */

    llms:
      llmsOK,

    promptEngineering:
      promptEngineeringOK,

    langchain:
      langchainOK,

    n8n:
      n8nOK,

    makeZapier:
      makeZapierOK,


    /*
     * Practical AI exposure
     */

    aiAgents:
      aiAgents >= 50,

    aiAutomationProjects:
      aiAutomationProjects >= 5,

    aiTools:
      aiTools >= 50

  };


  /*
   * ALL mandatory requirements
   * must pass.
   */

  const eligible =
    Object.values(requirements)
      .every(Boolean);


  return {

    eligible,

    internships,

    projects:
      totalProjects,

    aiAutomationProjects,

    certifications,

    dailyStudy,

    aiAgents,

    aiTools,

    communication:
      communicationOK,

    pythonLevel,

    requirements

  };

}


/* =========================================================
   MISSING REQUIREMENTS
   ========================================================= */

function getMissingRequirements(
  eligibility
) {

  const missing = [];


  const labels = {

    projects:
      "At least 15 projects",

    certifications:
      "At least 10 certifications",

    dailyStudy:
      "At least 4 hours daily study",

    communication:
      "English communication: Pretty Good or higher",

    html:
      "HTML",

    css:
      "CSS",

    javascript:
      "JavaScript",

    python:
      "Python",

    pythonLevel:
      "Python level: Advanced or Pro",

    logicBuilding:
      "Logic Building",

    oops:
      "OOPs",

    dsa:
      "DSA",

    llms:
      "LLMs",

    promptEngineering:
      "Prompt Engineering",

    langchain:
      "LangChain",

    n8n:
      "n8n",

    makeZapier:
      "Make/Zapier",

    aiAgents:
      "At least 50 AI Agents",

    aiAutomationProjects:
      "At least 5 AI / Automation projects",

    aiTools:
      "At least 50 AI Tools"

  };


  Object.entries(
    eligibility.requirements
  )
    .forEach(
      ([key, passed]) => {

        if (!passed) {

          missing.push(
            labels[key] || key
          );

        }

      }
    );


  return missing;

}


/* =========================================================
   FINAL READINESS SCORE
   ========================================================= */

function calculateFinalReadinessScore(
  backendScore = 0
) {

  const eligibility =
    checkJobReadinessEligibility();


  /* -------------------------------------------------------
     NOT ELIGIBLE
     ------------------------------------------------------- */

  if (!eligibility.eligible) {

    let score =
      Number(backendScore) || 0;


    score =
      Math.min(
        Math.max(score, 0),
        74
      );


    return {

      score,

      status:
        "Not Placed",

      readiness:
        "Needs improvement",

      eligible:
        false,

      missingRequirements:
        getMissingRequirements(
          eligibility
        ),

      eligibility

    };

  }


  /* -------------------------------------------------------
     ELIGIBLE
     ------------------------------------------------------- */

  let score = 75;


  /* -------------------------------------------------------
     OPTIONAL BONUS - INTERNSHIP
     ------------------------------------------------------- */

  if (
    eligibility.internships >= 1
  ) {

    score += 3;

  }


  /* -------------------------------------------------------
     PROJECT BONUS
     ------------------------------------------------------- */

  if (
    eligibility.projects >= 20
  ) {

    score += 4;

  }


  /* -------------------------------------------------------
     CERTIFICATION BONUS
     ------------------------------------------------------- */

  if (
    eligibility.certifications >= 15
  ) {

    score += 3;

  }


  /* -------------------------------------------------------
     STUDY BONUS
     ------------------------------------------------------- */

  if (
    eligibility.dailyStudy >= 5
  ) {

    score += 3;

  }


  /* -------------------------------------------------------
     AI AGENT BONUS
     ------------------------------------------------------- */

  if (
    eligibility.aiAgents >= 75
  ) {

    score += 3;

  }


  /* -------------------------------------------------------
     AI TOOL BONUS
     ------------------------------------------------------- */

  if (
    eligibility.aiTools >= 75
  ) {

    score += 3;

  }


  score =
    Math.min(
      score,
      100
    );


  return {

    score,

    status:
      "Placed",

    readiness:
      score >= 90
        ? "Excellent readiness"
        : "Strong readiness",

    eligible:
      true,

    missingRequirements: [],

    eligibility

  };

}


/* =========================================================
   NAVIGATION BUTTONS
   ========================================================= */

function setupNavigation() {


  /* -------------------------------------------------------
     NEXT BUTTONS
     ------------------------------------------------------- */

  document
    .querySelectorAll(".next-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const section =
            button.closest(
              ".form-section"
            );

          if (!section) return;


          const current =
            Number(
              section.id.split("-")[1]
            );


          if (
            validateStep(current)
          ) {

            goToSection(
              Math.min(
                5,
                current + 1
              )
            );

          }

        }
      );

    });


  /* -------------------------------------------------------
     PREVIOUS BUTTONS
     ------------------------------------------------------- */

  document
    .querySelectorAll(".prev-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const section =
            button.closest(
              ".form-section"
            );

          if (!section) return;


          const current =
            Number(
              section.id.split("-")[1]
            );


          goToSection(
            Math.max(
              1,
              current - 1
            )
          );

        }
      );

    });


  /* -------------------------------------------------------
     LEFT RAIL
     ------------------------------------------------------- */

  document
    .querySelectorAll(".rail-step")
    .forEach(step => {

      step.addEventListener(
        "click",
        () => {

          const target =
            step.dataset.target;

          if (!target) return;


          goToSection(
            Number(
              target.split("-")[1]
            )
          );

        }
      );

    });


  /* -------------------------------------------------------
     HEADER HELP
     ------------------------------------------------------- */

  if ($("topHelp")) {

    $("topHelp").addEventListener(
      "click",
      () => {

        goToSection(1);

      }
    );

  }

}


/* =========================================================
   SAMPLE DATA
   ========================================================= */

async function loadSample() {

  try {

    const response =
      await getJSON(
        "/api/sample-data"
      );

    const data =
      response.data || {};


    /* -------------------------------------------------------
       NORMAL FIELDS
       ------------------------------------------------------- */

    Object.entries(data)
      .forEach(
        ([key, value]) => {

          const element =
            $(key);

          if (element) {

            element.value =
              value ?? "";

          }

        }
      );


    /* -------------------------------------------------------
       COMMUNICATION
       ------------------------------------------------------- */

    const communicationValue =
      data.communication_skills ??
      8;


    if ($("communication_skills")) {

      $("communication_skills").value =
        communicationValue;

    }


    const communicationRadios =
      [
        ...document.querySelectorAll(
          'input[name="communication_level"]'
        )
      ];


    const communication =
      communicationRadios.find(
        radio =>
          String(radio.value) ===
          String(communicationValue)
      );


    communicationRadios
      .forEach(
        radio => {
          radio.checked = false;
        }
      );


    if (communication) {

      communication.checked = true;

    }


    /* -------------------------------------------------------
       SKILLS
       ------------------------------------------------------- */

    state.selectedSkills.clear();


    const sampleSkills =
      String(
        data.skills ||
        data.technical_skills ||
        ""
      )
        .split(",")
        .map(
          skill =>
            skill.trim()
        )
        .filter(Boolean);


    document
      .querySelectorAll(".skill-pill")
      .forEach(button => {

        button.classList.remove(
          "selected"
        );


        const buttonSkill =
          button.dataset.skill;


        if (
          sampleSkills.some(
            skill =>
              skill.toLowerCase() ===
              String(buttonSkill)
                .toLowerCase()
          )
        ) {

          state.selectedSkills.add(
            buttonSkill
          );

          button.classList.add(
            "selected"
          );

        }

      });


    collectSkills();


    /* -------------------------------------------------------
       PYTHON LEVEL
       ------------------------------------------------------- */

    if (
      data.python_level
    ) {

      const pythonRadio =
        document.querySelector(
          `input[name="python_level"][value="${CSS.escape(
            data.python_level
          )}"]`
        );


      if (pythonRadio) {

        pythonRadio.checked = true;

      }

    }


    /* -------------------------------------------------------
       ADDITIONAL TECH
       ------------------------------------------------------- */

    if (
      $("ai_agents") &&
      data.ai_agents !== undefined
    ) {

      $("ai_agents").value =
        data.ai_agents;

    }


    if (
      $("additional_projects") &&
      (
        data.additional_projects !== undefined ||
        data.ai_automation_projects !== undefined
      )
    ) {

      $("additional_projects").value =
        data.additional_projects ??
        data.ai_automation_projects;

    }


    if (
      $("ai_tools") &&
      data.ai_tools !== undefined
    ) {

      $("ai_tools").value =
        data.ai_tools;

    }


    updateAdditionalTechCount();


    /* -------------------------------------------------------
       CLEAR ERROR
       ------------------------------------------------------- */

    clearError();


    goToSection(1);


  } catch (error) {

    console.error(
      "Sample data error:",
      error
    );

    showError(
      error.message
    );

  }

}


/* =========================================================
   BUILD PAYLOAD
   ========================================================= */

function buildPayload() {

  return {

    /* -------------------------------------------------------
       BASIC
       ------------------------------------------------------- */

    name:
      $("name")?.value || "",

    gender:
      $("gender")?.value || "",

    age:
      $("age")?.value || "",

    degree:
      $("degree")?.value || "",


    /* -------------------------------------------------------
       EXISTING ML FEATURES
       ------------------------------------------------------- */

    branch:
      "Other",

    cgpa:
      "7",

    backlogs:
      "0",


    /* -------------------------------------------------------
       EXPERIENCE
       ------------------------------------------------------- */

    internships:
      $("internships")?.value || "0",

    certifications:
      $("certifications")?.value || "0",


    /*
     * Total completed projects
     */

    projects:
      $("projects")?.value || "0",


    /*
     * AI / automation projects
     */

    ai_automation_projects:
      $("additional_projects")?.value || "0",


    /* -------------------------------------------------------
       SKILLS
       ------------------------------------------------------- */

    coding_skills:
      $("coding_skills")?.value || "5",

    communication_skills:
      $("communication_skills")?.value || "0",

    aptitude_score:
      "70",


    /* -------------------------------------------------------
       AI EXPOSURE
       ------------------------------------------------------- */

    ai_agents:
      $("ai_agents")?.value || "0",

    ai_tools:
      $("ai_tools")?.value || "0",


    /* -------------------------------------------------------
       DAILY STUDY
       ------------------------------------------------------- */

    daily_study:
      getDailyStudyHours(),


    /*
     * Also send this name because your HTML
     * uses daily_hours.
     */

    daily_hours:
      getDailyStudyHours(),


    /* -------------------------------------------------------
       PYTHON
       ------------------------------------------------------- */

    python_level:
      getPythonLevel(),


    python_score:
      pythonLevelScore(),


    /* -------------------------------------------------------
       TECHNICAL SKILLS
       ------------------------------------------------------- */

    skills:
      $("technical_skills")?.value || ""

  };

}


/* =========================================================
   RENDER RESULTS
   ========================================================= */

function renderResults(result) {

  const placed =
    Math.min(
      100,
      Math.max(
        0,
        Number(
          result.confidence?.placed || 0
        )
      )
    );


  /* -------------------------------------------------------
     SCORE RING
     ------------------------------------------------------- */

  const ring =
    $("scoreRing");


  if (ring) {

    ring.style.background =
      `conic-gradient(
        var(--teal) ${placed * 3.6}deg,
        #eaf0f4 0deg
      )`;

  }


  if ($("placedScore")) {

    $("placedScore").textContent =
      `${placed.toFixed(0)}%`;

  }


  /* -------------------------------------------------------
     STATUS
     ------------------------------------------------------- */

  if ($("resultStatus")) {

    $("resultStatus").textContent =
      result.status ||
      "Result";

  }


  /* -------------------------------------------------------
     READINESS
     ------------------------------------------------------- */

  if ($("readinessText")) {

    $("readinessText").textContent =
      result.readiness ||
      "Readiness";

  }


  /* -------------------------------------------------------
     TIMESTAMP
     ------------------------------------------------------- */

  if ($("resultTimestamp")) {

    $("resultTimestamp").textContent =
      result.timestamp
        ? `Generated ${result.timestamp}`
        : "";

  }


  /* -------------------------------------------------------
     SUMMARY
     ------------------------------------------------------- */

  if ($("resultSummary")) {

    if (
      result.status === "Placed"
    ) {

      $("resultSummary").textContent =
        "Your profile meets the required AI job-readiness criteria. Keep building practical depth and real-world projects.";

    } else {

      $("resultSummary").textContent =
        "Your profile does not yet meet all mandatory AI job-readiness requirements. Strengthen the missing areas before aiming for placement.";

    }

  }


  /* -------------------------------------------------------
     STRENGTHS
     ------------------------------------------------------- */

  if ($("strengths")) {

    const strengths =
      result.analysis?.strengths || [];


    $("strengths").innerHTML =
      strengths
        .map(
          item => `
            <span class="tag">
              ${escapeHtml(item)}
            </span>
          `
        )
        .join("");

  }


  /* -------------------------------------------------------
     WEAKNESSES
     ------------------------------------------------------- */

  if ($("weaknesses")) {

    const weaknesses =
      result.analysis?.weaknesses || [];


    $("weaknesses").innerHTML =
      weaknesses
        .map(
          item => `
            <span class="tag weak">
              ${escapeHtml(item)}
            </span>
          `
        )
        .join("");

  }


  /* -------------------------------------------------------
     SCORE BARS
     ------------------------------------------------------- */

  const scores =
    result.analysis?.scores || {};


  if ($("scoreBars")) {

    $("scoreBars").innerHTML =
      Object.entries(scores)
        .map(
          ([name, value]) => {

            const numericValue =
              Number(value) || 0;


            return `
              <div class="score-bar">

                <span>
                  ${escapeHtml(name)}
                </span>

                <div class="bar">

                  <i
                    style="
                      width:${Math.min(
                        100,
                        numericValue * 10
                      )}%
                    "
                  ></i>

                </div>

                <b>
                  ${numericValue.toFixed(1)}
                </b>

              </div>
            `;

          }
        )
        .join("");

  }


  /* -------------------------------------------------------
     RECOMMENDATIONS
     ------------------------------------------------------- */

  if ($("recommendations")) {

    let recommendations =
      Array.isArray(
        result.recommendations
      )
        ? [...result.recommendations]
        : [];


    const missing =
      result.eligibility
        ?.missingRequirements || [];


    if (missing.length > 0) {

      recommendations = [
        ...missing.map(
          item =>
            `Improve: ${item}`
        ),
        ...recommendations
      ];

    }


    /*
     * Remove duplicate recommendations.
     */

    recommendations =
      [
        ...new Set(
          recommendations
        )
      ];


    $("recommendations").innerHTML =
      recommendations
        .map(
          (text, i) => `
            <div class="recommendation">

              <span>
                ${String(
                  i + 1
                ).padStart(2, "0")}
              </span>

              <p>
                ${escapeHtml(text)}
              </p>

            </div>
          `
        )
        .join("");

  }


  /* -------------------------------------------------------
     SHOW RESULT
     ------------------------------------------------------- */

  if ($("resultSection")) {

    $("resultSection").hidden =
      false;

  }

}


/* =========================================================
   SUBMIT ASSESSMENT
   ========================================================= */

async function submitAssessment(event) {

  event.preventDefault();

  clearError();


  /* -------------------------------------------------------
     VALIDATE ALL SECTIONS
     ------------------------------------------------------- */

  for (
    let i = 1;
    i <= 5;
    i++
  ) {

    if (
      !validateStep(i)
    ) {

      goToSection(i);

      return;

    }

  }


  const button =
    $("submitBtn");


  if (!button) return;


  button.disabled = true;


  const buttonText =
    button.querySelector(
      "span:first-child"
    );


  if (buttonText) {

    buttonText.textContent =
      "Analysing your profile…";

  }


  try {

    /* -----------------------------------------------------
       PAYLOAD
       ----------------------------------------------------- */

    const payload =
      buildPayload();


    console.log(
      "ASSESSMENT PAYLOAD:",
      payload
    );


    /* -----------------------------------------------------
       LOCAL ELIGIBILITY
       ----------------------------------------------------- */

    const localEligibility =
      checkJobReadinessEligibility();


    console.log(
      "JOB READINESS ELIGIBILITY:",
      localEligibility
    );


    console.log(
      "MISSING REQUIREMENTS:",
      getMissingRequirements(
        localEligibility
      )
    );


    /* -----------------------------------------------------
       ADDITIONAL TECH SCORE
       ----------------------------------------------------- */

    const additionalScore =
      calculateAdditionalTechScore();


    console.log(
      "ADDITIONAL TECH SCORE:",
      additionalScore
    );


    /* -----------------------------------------------------
       BACKEND API
       ----------------------------------------------------- */

    const result =
      await getJSON(
        "/api/predict",
        {

          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(
              payload
            )

        }
      );


    if (!result.success) {

      throw new Error(
        result.error ||
        result.errors?.join(", ") ||
        "Prediction failed."
      );

    }


    /* -----------------------------------------------------
       BACKEND SCORE
       ----------------------------------------------------- */

    const backendScore =
      Number(
        result.confidence?.placed || 0
      );


    console.log(
      "BACKEND ML SCORE:",
      backendScore
    );


    /* -----------------------------------------------------
       FINAL SCORE
       ----------------------------------------------------- */

    const finalReadiness =
      calculateFinalReadinessScore(
        backendScore
      );


    console.log(
      "FINAL READINESS:",
      finalReadiness
    );


    /* -----------------------------------------------------
       ENSURE CONFIDENCE OBJECT
       ----------------------------------------------------- */

    if (!result.confidence) {

      result.confidence = {};

    }


    /* -----------------------------------------------------
       OVERRIDE BACKEND SCORE
       ----------------------------------------------------- */

    result.confidence.placed =
      finalReadiness.score;


    result.status =
      finalReadiness.status;


    result.readiness =
      finalReadiness.readiness;


    /* -----------------------------------------------------
       SAVE ELIGIBILITY
       ----------------------------------------------------- */

    result.eligibility = {

      eligible:
        finalReadiness.eligible,

      missingRequirements:
        finalReadiness.missingRequirements,

      requirements:
        finalReadiness
          .eligibility
          .requirements,

      internships:
        finalReadiness
          .eligibility
          .internships,

      projects:
        finalReadiness
          .eligibility
          .projects,

      aiAutomationProjects:
        finalReadiness
          .eligibility
          .aiAutomationProjects,

      certifications:
        finalReadiness
          .eligibility
          .certifications,

      dailyStudy:
        finalReadiness
          .eligibility
          .dailyStudy,

      aiAgents:
        finalReadiness
          .eligibility
          .aiAgents,

      aiTools:
        finalReadiness
          .eligibility
          .aiTools,

      communication:
        finalReadiness
          .eligibility
          .communication,

      pythonLevel:
        finalReadiness
          .eligibility
          .pythonLevel

    };


    /* -----------------------------------------------------
       FINAL SAFETY CHECK
       ----------------------------------------------------- */

    if (
      !finalReadiness.eligible
    ) {

      /*
       * NOT ELIGIBLE
       *
       * Maximum score = 74%
       */

      result.confidence.placed =
        Math.min(
          Number(
            result.confidence.placed || 0
          ),
          74
        );


      result.status =
        "Not Placed";


      result.readiness =
        "Needs improvement";


    } else {

      /*
       * ELIGIBLE
       *
       * Minimum score = 75%
       */

      result.confidence.placed =
        Math.max(
          Number(
            result.confidence.placed || 0
          ),
          75
        );

    }


    /* -----------------------------------------------------
       RENDER
       ----------------------------------------------------- */

    renderResults(
      result
    );


  } catch (error) {

    console.error(
      "SUBMIT ERROR:",
      error
    );


    showError(
      error.message
    );


  } finally {

    button.disabled = false;


    if (buttonText) {

      buttonText.textContent =
        "Check my AI job readiness";

    }

  }

}


/* =========================================================
   EDIT RESULT
   ========================================================= */

function setupEditButton() {

  const editButton =
    $("editBtn");


  if (!editButton) return;


  editButton.addEventListener(
    "click",
    () => {

      if ($("resultSection")) {

        $("resultSection").hidden =
          true;

      }


      goToSection(1);


      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    }
  );

}


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeApp() {

  /* Form submit */

  if ($("assessmentForm")) {

    $("assessmentForm").addEventListener(
      "submit",
      submitAssessment
    );

  }


  /* Sample */

  if ($("sampleBtn")) {

    $("sampleBtn").addEventListener(
      "click",
      loadSample
    );

  }


  /* Skills */

  setupSkillPills();


  /* Communication */

  setupCommunication();


  /* Additional Tech */

  setupAdditionalTech();


  /* Navigation */

  setupNavigation();


  /* Edit */

  setupEditButton();


  /* Configuration */

  loadConfig();


  /* Initial state */

  collectSkills();


  updateAdditionalTechCount();


  goToSection(1);

}


/* =========================================================
   START APP
   ========================================================= */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeApp
  );

} else {

  initializeApp();

}