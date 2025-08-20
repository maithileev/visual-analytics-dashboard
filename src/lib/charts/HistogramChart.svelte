<script lang="ts">
    import { onMount } from "svelte";
    import * as d3 from "d3";
    import type { AggregatedBin } from "$lib/utils/aggregate";
  
    export let overallBinnedData: AggregatedBin[] = [];
    export let selectedBinnedData: AggregatedBin[] | null = null;
  
    let svg: SVGSVGElement;
    let hasMounted = false;
  
    const totalWidth = 480;    // smaller total width for the whole SVG
    const margin = { top: 40, right: 40, bottom: 50, left: 80 };  // wider left margin for labels
    const width = totalWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
  
    const overallColor = "#69b3a2";
    const selectedColor = "#ff6347";
    const overallOpacity = 0.5;
    const selectedOpacity = 0.8;
  
    onMount(() => {
      hasMounted = true;
      if (overallBinnedData.length) {
        drawChart(overallBinnedData, selectedBinnedData);
      }
    });
  
    $: if (hasMounted && overallBinnedData.length) {
      drawChart(overallBinnedData, selectedBinnedData);
    }
  
    function drawChart(overall: AggregatedBin[], selected: AggregatedBin[] | null) {
      if (!svg || !overall || !overall.length) return;
  
      d3.select(svg).selectAll("*").remove();
  
      const x = d3.scaleBand()
        .domain(overall.map(d => d.label))
        .range([0, width])
        .padding(0.3);
  
      const yLeft = d3.scaleLinear()
        .domain([0, d3.max(overall, d => Math.max(d.count, selected?.find(s => s.label === d.label)?.count || 0))! * 1.1])
        .range([height, 0]);
  
      const yRight = d3.scaleLinear().domain([0, 100]).range([height, 0]);
  
      const g = d3.select(svg)
        .attr("width", totalWidth)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
      // X Axis
      g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));
  
      // Left Y Axis
      g.append("g")
        .call(d3.axisLeft(yLeft));
  
      // Left Y Label
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Number of Listings");
  
      // Right Y Axis
      g.append("g")
        .attr("transform", `translate(${width},0)`)
        .call(d3.axisRight(yRight).tickFormat(d => d + "%"));
  
      // Right Y Label
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", width + 45)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Cumulative Percentage");
  
      // X Label
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Availability in the Coming Days");
  
      // Tooltip
      d3.select("#tooltip").remove();
      const tooltip = d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "#1a1a1a")
        .style("color", "#fff")
        .style("padding", "8px 10px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("box-shadow", "0 2px 6px rgba(0,0,0,0.3)")
        .style("pointer-events", "none")
        .style("font-size", "13px");
  
      // Draw Bars
      overall.forEach((d, i) => {
        const xPos = x(d.label)!;
  
        // Overall Bar
        g.append("rect")
          .attr("x", xPos)
          .attr("width", x.bandwidth())
          .attr("y", yLeft(d.count))
          .attr("height", height - yLeft(d.count))
          .attr("fill", overallColor)
          .attr("opacity", overallOpacity)
          .on("mouseenter", (event) => {
            tooltip.style("opacity", 1)
              .html(`<strong>${d.label}</strong><br/>Overall: ${d.count}<br/>Cumulative: ${d.cumulativePercent.toFixed(1)}%`)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseleave", () => tooltip.style("opacity", 0));
  
        // Selected Bar (overlay with minimum height)
        if (selected) {
          const sel = selected.find(s => s.label === d.label);
          if (sel) {
            const barHeight = height - yLeft(sel.count);
            const minBarHeight = 3;
            const effectiveHeight = barHeight < minBarHeight ? minBarHeight : barHeight;
            const effectiveY = barHeight < minBarHeight ? height - minBarHeight : yLeft(sel.count);
  
            g.append("rect")
              .attr("x", xPos)
              .attr("width", x.bandwidth())
              .attr("y", effectiveY)
              .attr("height", effectiveHeight)
              .attr("fill", selectedColor)
              .attr("opacity", selectedOpacity)
              .attr("stroke", "#000")
              .attr("stroke-width", 0.5)
              .on("mouseenter", (event) => {
                tooltip.style("opacity", 1)
                  .html(`<strong>${d.label}</strong><br/>Selected: ${sel.count}<br/>Cumulative: ${sel.cumulativePercent.toFixed(1)}%`)
                  .style("left", (event.pageX + 10) + "px")
                  .style("top", (event.pageY - 28) + "px");
              })
              .on("mouseleave", () => tooltip.style("opacity", 0));
  
            // Optional: Show count if it's tiny
            if (sel.count < d.count * 0.1) {
              g.append("text")
                .attr("x", xPos + x.bandwidth() / 2)
                .attr("y", effectiveY - 4)
                .attr("text-anchor", "middle")
                .style("font-size", "10px")
                .style("fill", "#000")
                .text(sel.count);
            }
          }
        }
      });
  
      // Cumulative line (from overall data)
      const line = d3.line<AggregatedBin>()
        .x(d => x(d.label)! + x.bandwidth() / 2)
        .y(d => yRight(d.cumulativePercent))
        .curve(d3.curveMonotoneX);
  
      g.append("path")
        .datum(overall)
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 2)
        .attr("d", line);
  
      g.selectAll(".dot")
        .data(overall)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.label)! + x.bandwidth() / 2)
        .attr("cy", d => yRight(d.cumulativePercent))
        .attr("r", 4)
        .attr("fill", "#000")
        .on("mouseenter", (event, d) => {
          tooltip.style("opacity", 1)
            .html(`<strong>${d.label}</strong><br/>Cumulative: ${d.cumulativePercent.toFixed(1)}%`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseleave", () => tooltip.style("opacity", 0));
  
      // Legend
      const legend = g.append("g").attr("transform", `translate(0, -20)`);
  
      legend.append("rect")
        .attr("x", 0).attr("y", 0)
        .attr("width", 15).attr("height", 15)
        .attr("fill", overallColor).attr("opacity", overallOpacity);
  
      legend.append("text")
        .attr("x", 20).attr("y", 12)
        .style("font-size", "12px")
        .text("All Listings");
  
      legend.append("rect")
        .attr("x", 0).attr("y", 20)
        .attr("width", 15).attr("height", 15)
        .attr("fill", selectedColor).attr("opacity", selectedOpacity);
  
      legend.append("text")
        .attr("x", 20).attr("y", 32)
        .style("font-size", "12px")
        .text("Selected Area");
    }
  </script>
  
  <svg bind:this={svg}></svg>
  
  <style>
    svg {
      font-family: sans-serif;
    }
  </style>
  