<!-- <script lang="ts">
    import * as d3 from 'd3';
  
    export let summaryData: {
      overview: Record<string, number>;
      region?: Record<string, number>;
    };
  
    let svg: SVGSVGElement;
    let tooltip: HTMLDivElement;
  
    let centerLabel = '';
    let centerPercent = '';
  
    const objToArray = (obj: Record<string, number>) =>
      Object.entries(obj).map(([label, value]) => ({ label, value }));
  
    // Collect all labels across both datasets
    $: allLabels = Array.from(new Set([
      ...Object.keys(summaryData.overview),
      ...(summaryData.region ? Object.keys(summaryData.region) : [])
    ]));
  
    // Default value to show
    function getDefaultLabel(data: Record<string, number>) {
      return data['Has License']
        ? { label: 'Has License', value: data['Has License'] }
        : Object.entries(data)[0];
    }
  
    $: if (summaryData?.overview) {
      const width = 300;
      const height = 300;
      const radius = Math.min(width, height) / 2;
  
      d3.select(svg).selectAll('*').remove();
  
      const svgSelection = d3.select(svg)
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);
  
      const color = d3.scaleOrdinal<string>()
        .domain(allLabels)
        .range(d3.schemeCategory10);
  
      const pie = d3.pie<{ label: string; value: number }>()
        .sort(null)
        .value(d => d.value);
  
      const arcOverview = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
        .innerRadius(0)
        .outerRadius(radius * 0.7);
  
      const arcRegion = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
        .innerRadius(radius * 0.75)
        .outerRadius(radius * 0.95);
  
      const overviewData = objToArray(summaryData.overview);
      const totalOverview = d3.sum(overviewData, d => d.value);
  
      // Default center label
      if (!centerLabel) {
        const [defaultLabel, defaultVal] = getDefaultLabel(summaryData.overview);
        centerLabel = defaultLabel;
        centerPercent = ((defaultVal / totalOverview) * 100).toFixed(1) + '%';
      }
  
      // Overview arcs
      const overviewArcs = svgSelection.selectAll('.arc-overview')
        .data(pie(overviewData))
        .enter()
        .append('g')
        .attr('class', 'arc-overview');
  
      overviewArcs.append('path')
        .attr('fill', d => color(d.data.label))
        .attr('d', arcOverview)
        .on('mouseover', (event, d) => {
          const percent = ((d.data.value / totalOverview) * 100).toFixed(1);
          tooltip.style.opacity = '1';
          tooltip.innerHTML = `<strong>${d.data.label}</strong>: ${percent}% (${d.data.value})`;
          const bounds = svg.getBoundingClientRect();
          tooltip.style.left = event.clientX - bounds.left + 10 + 'px';
          tooltip.style.top = event.clientY - bounds.top - 30 + 'px';
        })
        .on('mousemove', (event) => {
          const bounds = svg.getBoundingClientRect();
          tooltip.style.left = event.clientX - bounds.left + 10 + 'px';
          tooltip.style.top = event.clientY - bounds.top - 30 + 'px';
        })
        .on('mouseout', () => {
          tooltip.style.opacity = '0';
        })
        .on('click', (event, d) => {
          const percent = ((d.data.value / totalOverview) * 100).toFixed(1);
          centerLabel = d.data.label;
          centerPercent = percent + '%';
        });
  
      // Region arcs (outer)
      if (summaryData.region) {
        const regionData = objToArray(summaryData.region);
        const totalRegion = d3.sum(regionData, d => d.value);
  
        const regionArcs = svgSelection.selectAll('.arc-region')
          .data(pie(regionData))
          .enter()
          .append('g')
          .attr('class', 'arc-region');
  
        regionArcs.append('path')
          .attr('fill', d => color(d.data.label))
          .attr('d', arcRegion)
          .on('mouseover', (event, d) => {
            const percent = ((d.data.value / totalRegion) * 100).toFixed(1);
            tooltip.style.opacity = '1';
            tooltip.innerHTML = `<strong>${d.data.label}</strong>: ${percent}% (${d.data.value})`;
            const bounds = svg.getBoundingClientRect();
            tooltip.style.left = event.clientX - bounds.left + 10 + 'px';
            tooltip.style.top = event.clientY - bounds.top - 30 + 'px';
          })
          .on('mousemove', (event) => {
            const bounds = svg.getBoundingClientRect();
            tooltip.style.left = event.clientX - bounds.left + 10 + 'px';
            tooltip.style.top = event.clientY - bounds.top - 30 + 'px';
          })
          .on('mouseout', () => {
            tooltip.style.opacity = '0';
          })
          .on('click', (event, d) => {
            const percent = ((d.data.value / totalRegion) * 100).toFixed(1);
            centerLabel = d.data.label;
            centerPercent = percent + '%';
          });
      }
  
      // Center labels
      const centerGroup = svgSelection.append('g').attr('class', 'center-labels');
  
      centerGroup.append('text')
        .attr('class', 'center-label')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.4em')
        .attr('font-weight', '600')
        .attr('font-size', '1.1rem')
        .attr('fill', '#333')
        .text(centerLabel);
  
      centerGroup.append('text')
        .attr('class', 'center-percent')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.0em')
        .attr('font-weight', '400')
        .attr('font-size', '0.9rem')
        .attr('fill', '#555')
        .text(centerPercent);
    }
  </script>
  
  <style>
    .wrapper {
      position: relative;
      width: 300px;
      height: 300px;
    }
  
    .tooltip {
      position: absolute;
      background-color: white;
      border: 1px solid #ccc;
      padding: 6px 10px;
      font-size: 0.85rem;
      pointer-events: none;
      border-radius: 4px;
      box-shadow: 0 0 6px rgba(0, 0, 0, 0.15);
      opacity: 0;
      transition: opacity 0.2s ease;
      user-select: none;
      white-space: nowrap;
      z-index: 10;
    }
  </style>
  
  <div class="wrapper">
    <svg bind:this={svg}></svg>
    <div class="tooltip" bind:this={tooltip}></div>
  </div>
   -->

   <script lang="ts">
    import * as d3 from 'd3';
  
    export let summaryData: {
      overview: Record<string, number>;
      region?: Record<string, number>;
    };
  
    let svg: SVGSVGElement;
    let tooltip: HTMLDivElement;
  
    // Reactive center label info:
    let centerLabel = 'Superhost';
    let centerOvPercent = 0;
    let centerRegPercent: number | null = null;
    let centerDiff: number | null = null;
  
    const objToArray = (obj: Record<string, number>) =>
      Object.entries(obj).map(([label, value]) => ({ label, value }));
  
    $: allLabels = Array.from(new Set([
      ...Object.keys(summaryData.overview),
      ...(summaryData.region ? Object.keys(summaryData.region) : [])
    ]));
  
    $: 
      if (summaryData?.overview) {
  
      const width = 300;
      const height = 300;
      const radius = Math.min(width, height) / 2;
  
      d3.select(svg).selectAll('*').remove();
  
      const svgSelection = d3.select(svg)
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);
  
      const color = d3.scaleOrdinal<string>()
        .domain(allLabels)
        .range(['#a6cee3', '#b2df8a']); // your 2-color palette
  
      const pie = d3.pie<{ label: string; value: number }>()
        .sort(null)
        .value(d => d.value);
  
      const arcOverview = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
        .innerRadius(0)
        .outerRadius(radius * 0.7);
  
      const arcRegion = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
        .innerRadius(radius * 0.75)
        .outerRadius(radius * 0.95);
  
      const overviewData = objToArray(summaryData.overview);
      const totalOverview = d3.sum(overviewData, d => d.value);
      const regionData = summaryData.region ? objToArray(summaryData.region) : null;
      const totalRegion = regionData ? d3.sum(regionData, d => d.value) : null;
  
      // Initialize center label data:
      function setCenterData(label: string) {
        centerLabel = label;
        const ovVal = summaryData.overview[label] ?? 0;
        centerOvPercent = totalOverview ? (ovVal / totalOverview) * 100 : 0;
        if (summaryData.region && totalRegion) {
          const regVal = summaryData.region[label] ?? 0;
          centerRegPercent = totalRegion ? (regVal / totalRegion) * 100 : 0;
          centerDiff = centerRegPercent - centerOvPercent;
        } else {
          centerRegPercent = null;
          centerDiff = null;
        }
      }
  
      // Set initial center label to Superhost or first key
      setCenterData('Superhost' in summaryData.overview ? 'Superhost' : overviewData[0].label);
  
      // Append center labels group and text elements
      const centerGroup = svgSelection.append('g').attr('class', 'center-labels');
  
      const centerLabelText = centerGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.8em')
        .attr('font-weight', '600')
        .attr('font-size', '1rem')
        .attr('fill', '#333')
        .text(centerLabel);
  
      const centerOvText = centerGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('font-size', '0.85rem')
        .attr('fill', '#444')
        .text(`Ov: ${centerOvPercent.toFixed(1)}%`);
  
      const centerRegText = centerGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.4em')
        .attr('font-size', '0.8rem')
        .attr('fill', '#666')
        .text(centerRegPercent !== null
          ? `Reg: ${centerRegPercent.toFixed(1)}% (${centerDiff! >= 0 ? '+' : ''}${centerDiff!.toFixed(1)}%)`
          : '');
  
      // Function to update center texts on interaction
      function updateCenterText() {
        centerLabelText.text(centerLabel);
        centerOvText.text(`Ov: ${centerOvPercent.toFixed(1)}%`);
        centerRegText.text(centerRegPercent !== null
          ? `Reg: ${centerRegPercent.toFixed(1)}% (${centerDiff! >= 0 ? '+' : ''}${centerDiff!.toFixed(1)}%)`
          : '');
      }
  
      // Overview arcs
      const overviewArcs = svgSelection.selectAll('.arc-overview')
        .data(pie(overviewData))
        .enter()
        .append('g')
        .attr('class', 'arc-overview');
  
      overviewArcs.append('path')
        .attr('fill', d => color(d.data.label))
        .attr('d', arcOverview)
        .on('mouseover', (event, d) => {
          const percent = ((d.data.value / totalOverview) * 100).toFixed(1);
          tooltip.style.opacity = '1';
          tooltip.innerHTML = `<strong>${d.data.label}</strong>: ${percent}% (${d.data.value})`;
          const bounds = svg.getBoundingClientRect();
          tooltip.style.left = event.clientX - bounds.left + 10 + 'px';
          tooltip.style.top = event.clientY - bounds.top - 30 + 'px';
        })
        .on('mousemove', (event) => {
          const bounds = svg.getBoundingClientRect();
          tooltip.style.left = event.clientX - bounds.left + 10 + 'px';
          tooltip.style.top = event.clientY - bounds.top - 30 + 'px';
        })
        .on('mouseout', () => {
          tooltip.style.opacity = '0';
        })
        .on('click', (event, d) => {
          setCenterData(d.data.label);
          updateCenterText();
        });
  
      // No text inside overview arcs (removed)
  
      // Region arcs (outer)
      if (regionData) {
        const regionArcs = svgSelection.selectAll('.arc-region')
          .data(pie(regionData))
          .enter()
          .append('g')
          .attr('class', 'arc-region');
  
        regionArcs.append('path')
          .attr('fill', d => color(d.data.label))
          .attr('d', arcRegion)
          .on('mouseover', (event, d) => {
            const percent = ((d.data.value / totalRegion!) * 100).toFixed(1);
            tooltip.style.opacity = '1';
            tooltip.innerHTML = `<strong>${d.data.label}</strong>: ${percent}% (${d.data.value})`;
            const bounds = svg.getBoundingClientRect();
            tooltip.style.left = event.clientX - bounds.left + 10 + 'px';
            tooltip.style.top = event.clientY - bounds.top - 30 + 'px';
          })
          .on('mousemove', (event) => {
            const bounds = svg.getBoundingClientRect();
            tooltip.style.left = event.clientX - bounds.left + 10 + 'px';
            tooltip.style.top = event.clientY - bounds.top - 30 + 'px';
          })
          .on('mouseout', () => {
            tooltip.style.opacity = '0';
          })
          .on('click', (event, d) => {
            setCenterData(d.data.label);
            updateCenterText();
          });
      }
    }
  </script>
  
  <style>
    .wrapper {
      position: relative;
      width: 300px;
      height: 300px;
    }
  
    .tooltip {
      position: absolute;
      background-color: white;
      border: 1px solid #ccc;
      padding: 6px 10px;
      font-size: 0.85rem;
      pointer-events: none;
      border-radius: 4px;
      box-shadow: 0 0 6px rgba(0, 0, 0, 0.15);
      opacity: 0;
      transition: opacity 0.2s ease;
      user-select: none;
      white-space: nowrap;
      z-index: 10;
    }
  </style>
  
  <div class="wrapper">
    <svg bind:this={svg}></svg>
    <div class="tooltip" bind:this={tooltip}></div>
  </div>
    