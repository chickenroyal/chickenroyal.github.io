// Fetch and display events
function fetchAndDisplayEvents() {
  // Fetch the JSON file
  fetch('gigs.min.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not OK');
      }
      // Parse JSON data
      return response.json();
    })
    .then(eventsData => {
      // Group events by year and create tabs
      const eventsByYear = groupEventsByYear(eventsData);
      createTabs(eventsByYear);
    })
    .catch(error => {
      console.error('There was a problem fetching the JSON data:', error);
    });
}

// Group events by year
function groupEventsByYear(events) {
  const groupedEvents = {};
  events.forEach(event => {
    const year = new Date(event.date).getFullYear();
    if (!groupedEvents[year]) {
      groupedEvents[year] = [];
    }
    groupedEvents[year].push(event);
  });
  return groupedEvents;
}

// Create tabs and display events
function createTabs(eventsByYear) {
  const tabsContainer = document.getElementById('tabs-container');
  const tabContentContainer = document.getElementById('tab-content-container');

  // Clear previous content
  tabsContainer.innerHTML = '';
  tabContentContainer.innerHTML = '';
  tabsContainer.setAttribute('role', 'tablist');

  // Separate upcoming events into its own tab
  const today = new Date();
  const upcomingEvents = [];
  Object.values(eventsByYear).forEach(events => {
    events.forEach(event => {
      if (new Date(event.date) > today) {
        upcomingEvents.push(event);
      }
    });
  });

  // Add "Upcoming" tab first when there's any future events
  if (upcomingEvents.length > 0) {
    const upcomingTab = document.createElement('button');
    // Make "Upcoming" tab active by default
    upcomingTab.setAttribute('type', 'button');
    upcomingTab.setAttribute('role', 'tab');
    upcomingTab.className = 'tab active';
    upcomingTab.textContent = 'Upcoming';
    tabsContainer.appendChild(upcomingTab);

    const upcomingContent = document.createElement('div');
    // Display "Upcoming" content by default
    upcomingContent.className = 'tab-content active';
    upcomingContent.id = 'content-upcoming';
    upcomingContent.innerHTML = `
      <p><strong>Events:</strong> ${upcomingEvents.length}</p>
      <div class="events">
        ${createEventsHtml(upcomingEvents)}
      </div>
    `;
    tabContentContainer.appendChild(upcomingContent);

    // Add click event listener for tab
    upcomingTab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      upcomingTab.classList.add('active');
      upcomingContent.classList.add('active');
    });
  }

  // Reverse the order of years so most recent is first
  const sortedYears = Object.keys(eventsByYear).sort((a, b) => b - a);

  sortedYears.forEach((year, index) => {
    // Count the number of events for the year
    const eventCount = eventsByYear[year].length;

    // Create a tab for each year
    const tab = document.createElement('button');
    tab.setAttribute('type', 'button');
    tab.setAttribute('role', 'tab');
    tab.className = `tab ${upcomingEvents.length === 0 && index === 0 ? 'active' : ''}`;
    tab.textContent = year;
    tab.dataset.year = year;
    tabsContainer.appendChild(tab);

    // Create a content section for each year's events
    const tabContent = document.createElement('div');
    tabContent.className = `tab-content ${upcomingEvents.length === 0 && index === 0 ? 'active' : ''}`;
    tabContent.id = `content-${year}`;
    tabContent.innerHTML = `
      <p><strong>Events:</strong> ${eventCount}</p>
      <div class="events">
        ${createEventsHtml(eventsByYear[year])}
      </div>
    `;
    tabContentContainer.appendChild(tabContent);

    // Add click event listener for year tabs
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      tab.classList.add('active');
      tabContent.classList.add('active');
    });
  });
  
  // Combine all events into one array
  const allEvents = [];
  Object.values(eventsByYear).forEach(eventsArr => {
    allEvents.push(...eventsArr);
  });
  
  // Create "Stats" tab
  const statsTab = document.createElement('button');
  statsTab.setAttribute('type', 'button');
  statsTab.setAttribute('role', 'tab');
  statsTab.className = 'tab';
  statsTab.textContent = 'Stats';
  tabsContainer.appendChild(statsTab);

  const statsContent = document.createElement('div');
  statsContent.className = 'tab-content';
  statsContent.id = 'content-stats';
  statsContent.innerHTML = createStatsHtml(allEvents);
  tabContentContainer.appendChild(statsContent);

  // Add click event listener for accordions
  statsContent.addEventListener('click', (event) => {
    if (event.target && event.target.classList.contains('accordion-header')) {
      const content = event.target.nextElementSibling;
      // Toggle the display of the accordion-content
      content.style.display = content.style.display === 'block' ? 'none' : 'block';
    }
  });

  // Add click event listener for Stats tab
  statsTab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    statsTab.classList.add('active');
    statsContent.classList.add('active');
  });
}

// Create markup for events
function createEventsHtml(events) {
  return events
    .map(event => {
      // Convert UTC date to formatted date and time
      const dateTime = new Date(event.date);
      // Formats for month and day
      const monthOptions = { month: 'long' };
      const dayOptions = { weekday: 'long' };
      // Extract the year and day
      const year = dateTime.getFullYear();      
      const day = dateTime.getDate();
      // Format dates and time
      const formattedDate = `${new Intl.DateTimeFormat('en-GB', dayOptions).format(dateTime)} ${getOrdinalSuffix(day)} ${new Intl.DateTimeFormat('en-GB', monthOptions).format(dateTime)} ${year}`;
      const formattedTime = dateTime.toISOString().split('T')[1].slice(0, 5);

      // Convert UTC end date if provided
      let formattedEndDate = "";
      if (event.endDate) {
        const endDateTime = new Date(event.endDate);
        // Extract the year and day
        const endYear = endDateTime.getFullYear();        
        const endDay = endDateTime.getDate();
        // Format end date
        formattedEndDate = `${new Intl.DateTimeFormat('en-GB', dayOptions).format(endDateTime)} ${getOrdinalSuffix(endDay)} ${new Intl.DateTimeFormat('en-GB', monthOptions).format(endDateTime)} ${endYear}`;
      }

      // Separate headliner and support artists
      const headliner = event.artists.find(artist => artist.role === 'headliner');
      const supportArtists = event.artists.filter(artist => artist.role === 'support');

      // Update Support/Line up for shows/festivals
      const supportLineUp = event.eventType === "festival" ? "Line up" : "Support";

      // Ensure ticket prices have two decimal places
      const ticketPrice = event.ticket.price.toFixed(2);

      // Determine event title (event name or headliner)
      const eventTitle = event.eventName ? event.eventName : (headliner ? headliner.name : "Unknown Event");
      
      // Build the event details
      return `
        <div class="event">
          <h2>${eventTitle}</h2>
          <!-- <p><strong>Type:</strong> ${event.eventType}</p> -->
          <p><strong>Date:</strong> ${formattedDate} ${formattedEndDate ? ` - ${formattedEndDate}` : ""}</p>
          <p><strong>Time:</strong> ${formattedTime}</p>
          <p><strong>Venue:</strong> ${event.location.venue}</p>
          <p><strong>City:</strong> ${event.location.city}, ${event.location.country}</p>
          ${event.eventType === "show" && event.eventName
            ? `<p><strong>Headliner:</strong> ${headliner ? headliner.name : "None"}</p>`
            : ""}
          ${supportArtists.length > 0
            ? `<p><strong>${supportLineUp}:</strong></p>
            <ul>${supportArtists.map(artist => `<li>${artist.name}</li>`).join('')}</ul>`
            : ""}
          <p><strong>Ticket:</strong> ${event.ticket.currency}${ticketPrice} (${event.ticket.ticketType})</p>
        </div>`;
    })
    .join('');
}

// Create markup for the Stats tab
function createStatsHtml(events) {
  // Count total number of events
  const totalEvents = events.length;

  // Artist frequency calculation
  const artistFrequency = {};
  events.forEach(event => {
    if (event.artists && event.artists.length) {
      event.artists.forEach(artist => {
        const name = artist.name;
        artistFrequency[name] = (artistFrequency[name] || 0) + 1;
      });
    }
  });
  const artistGrouped = groupFrequency(artistFrequency);

  // Venue frequency calculation
  const venueFrequency = {};
  events.forEach(event => {
    if (event.location && event.location.venue) {
      const venue = event.location.venue;
      venueFrequency[venue] = (venueFrequency[venue] || 0) + 1;
    }
  });
  const venueGrouped = groupFrequency(venueFrequency);
  
  // City frequency calculation (new grouping)
  const cityFrequency = {};
  events.forEach(event => {
    if (event.location && event.location.city) {
      const city = event.location.city;
      cityFrequency[city] = (cityFrequency[city] || 0) + 1;
    }
  });
  const cityGrouped = groupFrequency(cityFrequency);

  // Country frequency calculation
  const countryFrequency = {};
  events.forEach(event => {
    if (event.location && event.location.country) {
      const country = event.location.country;
      countryFrequency[country] = (countryFrequency[country] || 0) + 1;
    }
  });
  const countryGrouped = groupFrequency(countryFrequency);

  // Build stats markup with each section
  let html = `<p><strong>Total number of events:</strong> ${totalEvents}</p>`;
  html += '<div class="stats">';
  html += buildGroupedSectionHtml("Artists", artistGrouped);
  html += buildGroupedSectionHtml("Venues", venueGrouped);
  html += buildGroupedSectionHtml("Cities", cityGrouped);
  html += buildGroupedSectionHtml("Countries", countryGrouped);
  html += '</div>';
  return html;
}

// Group items by their appearance count
function groupFrequency(frequencyObj) {
  const frequencyGroups = {};
  Object.keys(frequencyObj).forEach(item => {
    const count = frequencyObj[item];
    if (!frequencyGroups[count]) {
      frequencyGroups[count] = [];
    }
    frequencyGroups[count].push(item);
  });
  return frequencyGroups;
}

// Build accordions
function buildGroupedSectionHtml(sectionTitle, groupedData) {
  let html = `<div class="stat" role="tablist">`;
  // Make section header the accordion toggle
  html += `<button class="accordion-header" type="button" role="tab">${sectionTitle}</button>`;
  // Accordion content wrapper, shown by default
  html += `<div class="accordion-content" style="display: block">`;

  // Get frequency groups sorted in descending order (highest count first)
  const sortedFrequencies = Object.keys(groupedData)
    .map(num => parseInt(num, 10))
    .sort((a, b) => b - a);

  sortedFrequencies.forEach(freq => {
    // Sort the names alphabetically in a case-insensitive manner
    const sortedNames = groupedData[freq].sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );
    html += `<div class="stats-group">`;
    html += `<h3>${freq} event${freq > 1 ? 's' : ''}</h3>`;
    html += `<ul>`;
    sortedNames.forEach(name => {
      html += `<li>${name}</li>`;
    });
    html += `</ul>`;
    html += `</div>`;
  });

  html += `</div></div>`;
  return html;
}

// Function to add ordinal suffixes
function getOrdinalSuffix(day) {
  if (day % 10 === 1 && day % 100 !== 11) {
    return `${day}st`;
  } else if (day % 10 === 2 && day % 100 !== 12) {
    return `${day}nd`;
  } else if (day % 10 === 3 && day % 100 !== 13) {
    return `${day}rd`;
  }
  return `${day}th`;
}

// Fetch and display events when the page loads
fetchAndDisplayEvents();
